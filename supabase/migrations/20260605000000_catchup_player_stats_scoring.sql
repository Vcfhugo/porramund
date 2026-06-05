-- ============================================================
-- CATCH-UP — Porra Mundial 2026
-- Aplica las piezas de schema.sql que faltaban en el proyecto:
--   · tabla wc_player_stats (goles + asistencias)
--   · RLS + policies de wc_player_stats
--   · helper is_porra_creator
--   · función de scoring + trigger + recalculate_all_porras
-- 100% idempotente: no borra datos, seguro re-ejecutar.
-- ============================================================

-- ── Stats de jugadores ───────────────────────────────────────
create table if not exists wc_player_stats (
  player_id  text primary key,
  team       text not null,
  goals      int  not null default 0,
  assists    int  not null default 0,
  updated_at timestamptz default now()
);

alter table wc_player_stats enable row level security;

-- Helper de seguridad (usado por las policies de admin)
create or replace function is_porra_creator()
returns boolean language sql security definer stable
as $$
  select exists (select 1 from porras where created_by = auth.uid());
$$;

drop policy if exists "player_stats_public_read"  on wc_player_stats;
drop policy if exists "player_stats_admin_write"  on wc_player_stats;
create policy "player_stats_public_read" on wc_player_stats for select using (true);
create policy "player_stats_admin_write" on wc_player_stats for all
  using (is_porra_creator()) with check (is_porra_creator());

-- ── Realtime: emitir cambios de stats y de partidos ──────────
do $$ begin
  begin alter publication supabase_realtime add table wc_player_stats; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table wc_matches;      exception when duplicate_object then null; end;
end $$;

-- ── Función de scoring (idéntica a schema.sql) ───────────────
create or replace function recalculate_scores(p_porra_id uuid)
returns void language plpgsql security definer as $$
declare
  r_pick           record;
  r_match          record;
  v_picks          jsonb;
  v_all_teams      text[];
  v_group_pts      int;
  v_knockout_pts   int;
  v_goalscorer_pts int;
  v_duo_pts        int;
  v_total          numeric;
  v_winner         text;
  v_round_pts      int;
  v_ranked_teams   text[];
begin
  for r_pick in
    select p.user_id, p.data from picks p where p.porra_id = p_porra_id
  loop
    v_picks          := r_pick.data;
    v_group_pts      := 0;
    v_knockout_pts   := 0;
    v_goalscorer_pts := 0;
    v_duo_pts        := 0;
    v_ranked_teams   := '{}';

    v_all_teams := array(
      select t from (
        select jsonb_array_elements_text(coalesce(v_picks->'g1','[]'::jsonb)) as t
        union all select jsonb_array_elements_text(coalesce(v_picks->'g2','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g3','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g4','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g5','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g6','[]'::jsonb))
        union all select v_picks->>'g5' where v_picks->>'g5' is not null
          and jsonb_typeof(v_picks->'g5') = 'string'
      ) sub where t is not null
    );

    -- Fase de grupos
    for r_match in
      select * from wc_matches where status = 'finished' and round = 'group'
    loop
      if r_match.home_score > r_match.away_score then
        if r_match.home = any(v_all_teams) then v_group_pts := v_group_pts + 3; end if;
      elsif r_match.home_score < r_match.away_score then
        if r_match.away = any(v_all_teams) then v_group_pts := v_group_pts + 3; end if;
      elsif r_match.home_score = r_match.away_score then
        if r_match.home = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
        if r_match.away = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
      end if;

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

    -- Eliminatorias
    for r_match in
      select * from wc_matches where status = 'finished' and round in ('r32','r16','qf','sf','final')
    loop
      v_round_pts := case r_match.round
        when 'r32' then 3 when 'r16' then 5 when 'qf' then 8
        when 'sf' then 10 when 'final' then 15 else 0 end;
      v_winner := case when r_match.home_score >= r_match.away_score
        then r_match.home else r_match.away end;
      if v_winner = any(v_all_teams) then
        v_knockout_pts := v_knockout_pts + v_round_pts;
        if r_match.round = 'final' then v_knockout_pts := v_knockout_pts + 20; end if;
      end if;
    end loop;

    -- Dúo dinámico
    declare v_duo_player text; v_duo_g_a int;
    begin
      for v_duo_player in
        select jsonb_array_elements_text(coalesce(v_picks->'duo', '[]'::jsonb))
      loop
        if v_duo_player is not null and v_duo_player <> 'null' then
          select coalesce(goals,0) + coalesce(assists,0) into v_duo_g_a
            from wc_player_stats where player_id = v_duo_player;
          v_duo_pts := v_duo_pts + coalesce(v_duo_g_a, 0);
        end if;
      end loop;
    end;

    -- Goleadores
    declare
      v_gs_team text; v_gs_player text; v_gs_correct int := 0;
      v_gs_max_goals int; v_gs_pl_goals int;
    begin
      for v_gs_team, v_gs_player in
        select key, value from jsonb_each_text(coalesce(v_picks->'goalscorer', '{}'::jsonb))
      loop
        select max(goals) into v_gs_max_goals from wc_player_stats where team = v_gs_team;
        select coalesce(goals,0) into v_gs_pl_goals from wc_player_stats where player_id = v_gs_player;
        if coalesce(v_gs_max_goals,0) > 0 and coalesce(v_gs_pl_goals,0) >= v_gs_max_goals then
          v_gs_correct := v_gs_correct + 1;
        end if;
      end loop;
      v_goalscorer_pts := case v_gs_correct when 1 then 5 when 2 then 10 else 0 end;
    end;

    v_total := v_group_pts + v_knockout_pts + v_goalscorer_pts + v_duo_pts;

    insert into scores (porra_id, user_id, total_pts, breakdown, updated_at)
    values (
      p_porra_id, r_pick.user_id, v_total::int,
      jsonb_build_object(
        'group_pts', v_group_pts, 'knockout_pts', v_knockout_pts,
        'goalscorer_pts', v_goalscorer_pts, 'duo_pts', v_duo_pts
      ), now()
    )
    on conflict (porra_id, user_id) do update
      set total_pts = excluded.total_pts,
          breakdown = excluded.breakdown,
          updated_at = now();
  end loop;
end;
$$;

-- ── Trigger: recalcular al cerrar un partido ─────────────────
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

-- ── Recalcular todas las porras (job / manual) ───────────────
create or replace function recalculate_all_porras()
returns void language plpgsql security definer as $$
declare r record;
begin
  for r in select distinct porra_id from picks loop
    perform recalculate_scores(r.porra_id);
  end loop;
end;
$$;
