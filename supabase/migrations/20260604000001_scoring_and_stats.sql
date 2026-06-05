-- ============================================================
-- PORRA MUNDIAL 2026 — Migración 2: scoring completo + player stats
-- Pegar en: supabase.com → SQL Editor → New query → Run
-- ============================================================

-- ── 1. Tabla de estadísticas de jugadores ─────────────────
create table if not exists wc_player_stats (
  player_id  text primary key,
  team       text not null,
  goals      int  not null default 0,
  assists    int  not null default 0,
  updated_at timestamptz default now()
);
alter table wc_player_stats enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename='wc_player_stats' and policyname='player_stats_public_read'
  ) then
    execute 'create policy player_stats_public_read on wc_player_stats for select using (true)';
  end if;
  if not exists (
    select 1 from pg_policies
    where tablename='wc_player_stats' and policyname='player_stats_service_write'
  ) then
    execute 'create policy player_stats_service_write on wc_player_stats for all using (true)';
  end if;
end; $$;


-- ── 2. Función para recalcular TODAS las porras a la vez ──
create or replace function recalculate_all_porras()
returns void language plpgsql security definer as $$
declare r record;
begin
  for r in select distinct porra_id from picks loop
    perform recalculate_scores(r.porra_id);
  end loop;
end;
$$;


-- ── 3. Función principal de scoring (completa y corregida) ─
create or replace function recalculate_scores(p_porra_id uuid)
returns void language plpgsql security definer as $$
declare
  r_pick           record;
  r_match          record;
  v_picks          jsonb;
  v_all_teams      text[];
  v_g5_teams       text[];
  v_group_pts      int;
  v_knockout_pts   int;
  v_goalscorer_pts int;
  v_duo_pts        int;
  v_total          int;
  v_winner         text;
  v_round_pts      int;
  v_ranked_teams   text[];
  v_porra_config   jsonb;
begin
  select config into v_porra_config from porras where id = p_porra_id;

  for r_pick in
    select p.user_id, p.data from picks p where p.porra_id = p_porra_id
  loop
    v_picks          := r_pick.data;
    v_group_pts      := 0;
    v_knockout_pts   := 0;
    v_goalscorer_pts := 0;
    v_duo_pts        := 0;
    v_ranked_teams   := '{}';

    -- Todos los equipos elegidos
    v_all_teams := array(
      select t from (
        select jsonb_array_elements_text(coalesce(v_picks->'g1','[]'::jsonb)) as t
        union all select jsonb_array_elements_text(coalesce(v_picks->'g2','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g3','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g4','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g6','[]'::jsonb))
        -- g5 puede ser string o array
        union all select v_picks->>'g5'
          where v_picks->>'g5' is not null
            and jsonb_typeof(v_picks->'g5') = 'string'
        union all select jsonb_array_elements_text(v_picks->'g5')
          where jsonb_typeof(v_picks->'g5') = 'array'
      ) sub where t is not null and t <> 'null'
    );

    -- Equipos del Grupo 5 (Relleno × 2.5)
    v_g5_teams := array(
      select jsonb_array_elements_text(
        coalesce(v_porra_config->'porraGroups'->4->'teams', '[]'::jsonb)
      )
    );

    -- ── FASE DE GRUPOS ──────────────────────────────────────
    for r_match in
      select * from wc_matches where status = 'finished' and round = 'group'
    loop
      if r_match.home_score > r_match.away_score then
        if r_match.home = any(v_all_teams) then v_group_pts := v_group_pts + 3; end if;
      elsif r_match.home_score < r_match.away_score then
        if r_match.away = any(v_all_teams) then v_group_pts := v_group_pts + 3; end if;
      else
        if r_match.home = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
        if r_match.away = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
      end if;

      -- Bonus posición final (1 sola vez por equipo)
      if r_match.home_rank is not null and not (r_match.home = any(v_ranked_teams)) then
        v_ranked_teams := v_ranked_teams || r_match.home;
        if r_match.home = any(v_all_teams) then
          if    r_match.home_rank = 1 then v_group_pts := v_group_pts + 5;
          elsif r_match.home_rank = 2 then v_group_pts := v_group_pts + 3;
          end if;
        end if;
      end if;
      if r_match.away_rank is not null and not (r_match.away = any(v_ranked_teams)) then
        v_ranked_teams := v_ranked_teams || r_match.away;
        if r_match.away = any(v_all_teams) then
          if    r_match.away_rank = 1 then v_group_pts := v_group_pts + 5;
          elsif r_match.away_rank = 2 then v_group_pts := v_group_pts + 3;
          end if;
        end if;
      end if;
    end loop;

    -- ── ELIMINATORIAS ───────────────────────────────────────
    for r_match in
      select * from wc_matches
      where status = 'finished' and round in ('r32','r16','qf','sf','final')
    loop
      v_round_pts := case r_match.round
        when 'r32' then 3 when 'r16' then 5
        when 'qf'  then 8 when 'sf'  then 10
        when 'final' then 15 else 0
      end;
      v_winner := case
        when r_match.home_score >= r_match.away_score then r_match.home
        else r_match.away
      end;
      if v_winner = any(v_all_teams) then
        v_knockout_pts := v_knockout_pts + v_round_pts;
        if r_match.round = 'final' then v_knockout_pts := v_knockout_pts + 20; end if;
      end if;
    end loop;

    -- ── DÚO DINÁMICO — goles + asistencias reales ───────────
    declare
      v_duo_pid text;
      v_duo_ga  int;
    begin
      for v_duo_pid in
        select jsonb_array_elements_text(coalesce(v_picks->'duo','[]'::jsonb))
      loop
        if v_duo_pid is not null and v_duo_pid <> 'null' then
          select coalesce(goals,0) + coalesce(assists,0)
            into v_duo_ga from wc_player_stats where player_id = v_duo_pid;
          v_duo_pts := v_duo_pts + coalesce(v_duo_ga, 0);
        end if;
      end loop;
    end;

    -- ── GOLEADORES — máximo goleador del equipo ──────────────
    declare
      v_gs_team      text;
      v_gs_player    text;
      v_gs_correct   int := 0;
      v_gs_max_goals int;
      v_gs_pl_goals  int;
    begin
      for v_gs_team, v_gs_player in
        select key, value from jsonb_each_text(coalesce(v_picks->'goalscorer','{}'::jsonb))
      loop
        select max(goals) into v_gs_max_goals
          from wc_player_stats where team = v_gs_team;
        select coalesce(goals,0) into v_gs_pl_goals
          from wc_player_stats where player_id = v_gs_player;
        if coalesce(v_gs_max_goals,0) > 0
           and coalesce(v_gs_pl_goals,0) >= v_gs_max_goals then
          v_gs_correct := v_gs_correct + 1;
        end if;
      end loop;
      v_goalscorer_pts := case v_gs_correct when 1 then 5 when 2 then 10 else 0 end;
    end;

    v_total := v_group_pts + v_knockout_pts + v_goalscorer_pts + v_duo_pts;

    insert into scores (porra_id, user_id, total_pts, breakdown, updated_at)
    values (
      p_porra_id, r_pick.user_id, v_total,
      jsonb_build_object(
        'group_pts',      v_group_pts,
        'knockout_pts',   v_knockout_pts,
        'goalscorer_pts', v_goalscorer_pts,
        'duo_pts',        v_duo_pts
      ),
      now()
    )
    on conflict (porra_id, user_id) do update
      set total_pts  = excluded.total_pts,
          breakdown  = excluded.breakdown,
          updated_at = now();
  end loop;
end;
$$;


-- ── 4. Trigger actualizado (también se dispara al cambiar stats) ──
create or replace function trigger_recalculate_on_match()
returns trigger language plpgsql security definer as $$
declare r_porra record;
begin
  if new.status = 'finished' and (old.status is distinct from 'finished') then
    for r_porra in select distinct porra_id from picks loop
      perform recalculate_scores(r_porra.porra_id);
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_match_finished on wc_matches;
create trigger on_match_finished
  after update on wc_matches
  for each row execute function trigger_recalculate_on_match();


-- ── 5. Cron job (requiere pg_cron + pg_net activados en Extensions)
--    Sustituye TU_SERVICE_ROLE_KEY por el valor de Settings → API
-- select cron.schedule(
--   'sync-matches',
--   '*/5 * * * *',
--   $$
--     select net.http_post(
--       url     := 'https://jnreyahnzaektdirtzcu.supabase.co/functions/v1/sync-matches',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer TU_SERVICE_ROLE_KEY',
--         'Content-Type',  'application/json'
--       ),
--       body    := '{}'::jsonb
--     );
--   $$
-- );
