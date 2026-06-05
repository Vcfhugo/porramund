-- ============================================================
-- PORRA MUNDIAL 2026 — Schema de Supabase
-- Pegar en: Supabase → SQL Editor → Nuevo query → Run
-- ============================================================

-- Porras (partidas)
create table if not exists porras (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  name        text not null,
  price       int  default 10,
  deadline    timestamptz,
  config      jsonb not null default '{}',   -- porraGroups + rules
  created_by  uuid references auth.users on delete set null,
  created_at  timestamptz default now()
);

-- Miembros de cada porra
create table if not exists members (
  id           uuid primary key default gen_random_uuid(),
  porra_id     uuid references porras on delete cascade,
  user_id      uuid references auth.users on delete cascade,
  display_name text not null default 'Jugador',
  joined_at    timestamptz default now(),
  unique(porra_id, user_id)
);

-- Picks de cada jugador en cada porra
create table if not exists picks (
  id        uuid primary key default gen_random_uuid(),
  porra_id  uuid references porras  on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  data      jsonb not null default '{}',  -- { g1:[], g2:[], goalscorer:{}, duo:[] }
  locked    boolean default false,        -- true después del deadline
  updated_at timestamptz default now(),
  unique(porra_id, user_id)
);

-- Partidos del Mundial (el admin introduce los resultados)
create table if not exists wc_matches (
  id          text primary key,           -- 'm1', 'm2', ...
  home        text not null,
  away        text not null,
  home_score  int,
  away_score  int,
  status      text default 'upcoming',    -- upcoming | live | finished
  match_date  timestamptz,
  group_code  text,
  round       text default 'group',       -- group | r32 | r16 | qf | sf | final
  home_rank   int,                        -- posición final en el grupo
  away_rank   int,
  updated_at  timestamptz default now()
);

-- Stats de jugadores (goles + asistencias en el Mundial)
create table if not exists wc_player_stats (
  player_id  text primary key,   -- nuestro ID interno (messi, mbappe, yamal…)
  team       text not null,      -- id de equipo (arg, fra, esp…)
  goals      int  not null default 0,
  assists    int  not null default 0,
  updated_at timestamptz default now()
);

-- Puntuaciones calculadas (se actualizan al introducir resultados)
create table if not exists scores (
  id        uuid primary key default gen_random_uuid(),
  porra_id  uuid references porras on delete cascade,
  user_id   uuid references auth.users on delete cascade,
  total_pts int default 0,
  breakdown jsonb default '{}',  -- { group_pts, knockout_pts, goalscorer_pts, duo_pts }
  updated_at timestamptz default now(),
  unique(porra_id, user_id)
);


-- ============================================================
-- HELPERS DE SEGURIDAD
-- Definir antes de las policies que los usan
-- ============================================================

-- ¿Es el usuario actual creador de alguna porra? (usado en RLS)
create or replace function is_porra_creator()
returns boolean language sql security definer stable
as $$
  select exists (select 1 from porras where created_by = auth.uid());
$$;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table porras           enable row level security;
alter table members          enable row level security;
alter table picks            enable row level security;
alter table wc_matches       enable row level security;
alter table wc_player_stats  enable row level security;
alter table scores           enable row level security;

-- Porras: lectura pública, escritura solo creador
create policy "porras_public_read"   on porras for select using (true);
create policy "porras_creator_write" on porras for insert
  with check (auth.uid() = created_by);

-- Members: lectura pública, inserción propia
create policy "members_public_read"  on members for select using (true);
create policy "members_self_insert"  on members for insert
  with check (auth.uid() = user_id);
create policy "members_self_update"  on members for update
  using (auth.uid() = user_id);
-- El creador de la porra puede expulsar miembros
create policy "members_creator_delete" on members for delete
  using (
    exists (
      select 1 from porras
      where porras.id = members.porra_id
        and porras.created_by = auth.uid()
    )
  );

-- Picks: lectura propia; escritura solo antes del deadline y si no está bloqueado
create policy "picks_owner_select" on picks for select
  using (auth.uid() = user_id);

create policy "picks_owner_insert" on picks for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from porras
      where id = porra_id and deadline is not null and deadline < now()
    )
  );

create policy "picks_owner_update" on picks for update
  using  (auth.uid() = user_id and locked = false)
  with check (
    auth.uid() = user_id and locked = false
    and not exists (
      select 1 from porras
      where id = porra_id and deadline is not null and deadline < now()
    )
  );
-- Los miembros pueden ver los picks de su misma porra (para leaderboard)
create policy "picks_members_read" on picks for select
  using (
    exists (
      select 1 from members
      where members.porra_id = picks.porra_id
        and members.user_id = auth.uid()
    )
  );

-- WC Player Stats: lectura pública, escritura solo para creadores de porra
create policy "player_stats_public_read"  on wc_player_stats for select using (true);
create policy "player_stats_admin_write"  on wc_player_stats for all
  using (is_porra_creator()) with check (is_porra_creator());

-- WC Matches: lectura pública, escritura solo para creadores de porra
create policy "matches_public_read"  on wc_matches for select using (true);
create policy "matches_admin_write"  on wc_matches for all
  using (is_porra_creator()) with check (is_porra_creator());

-- Scores: lectura pública dentro de la porra
create policy "scores_members_read" on scores for select
  using (
    exists (
      select 1 from members
      where members.porra_id = scores.porra_id
        and members.user_id = auth.uid()
    )
  );
-- scores: sin policy de escritura para usuarios — solo recalculate_scores (SECURITY DEFINER)


-- ============================================================
-- FUNCIÓN DE SCORING
-- Llama con: select recalculate_scores('uuid-de-la-porra');
-- Puntos: grupo win=3, draw=1 | 1º=+5, 2º=+3
--         R32=3, R16=5, QF=8, SF=10, Final=15, Campeón=+20
--         Goleadores: +5 uno, +10 ambos | Dúo: goles+asist directos
-- ============================================================
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
  v_total          numeric;
  v_winner         text;
  v_round_pts      int;
  v_ranked_teams   text[];   -- evita doble bonus de posición
  v_porra_config   jsonb;
begin
  -- Obtener la config de la porra (para saber qué equipos son G5 × 2.5)
  select config into v_porra_config from porras where id = p_porra_id;

  for r_pick in
    select p.user_id, p.data
    from picks p
    where p.porra_id = p_porra_id
  loop
    v_picks           := r_pick.data;
    v_group_pts       := 0;
    v_knockout_pts    := 0;
    v_goalscorer_pts  := 0;
    v_duo_pts         := 0;
    v_ranked_teams    := '{}';

    -- Todos los equipos elegidos (g1..g6; g5 puede ser un valor único o array)
    v_all_teams := array(
      select t from (
        select jsonb_array_elements_text(coalesce(v_picks->'g1','[]'::jsonb)) as t
        union all select jsonb_array_elements_text(coalesce(v_picks->'g2','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g3','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g4','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g5','[]'::jsonb))
        union all select jsonb_array_elements_text(coalesce(v_picks->'g6','[]'::jsonb))
        -- g5 puede ser string único (null si no elegido)
        union all select v_picks->>'g5' where v_picks->>'g5' is not null
          and jsonb_typeof(v_picks->'g5') = 'string'
      ) sub where t is not null
    );

    -- Equipos del grupo 5 (Relleno × 2.5) — desde config de la porra
    v_g5_teams := array(
      select jsonb_array_elements_text(
        coalesce(v_porra_config->'porraGroups'->4->'teams', '[]'::jsonb)
      )
    );

    -- ── FASE DE GRUPOS ──────────────────────────────────────
    for r_match in
      select * from wc_matches
      where status = 'finished' and round = 'group'
    loop
      if r_match.home_score > r_match.away_score then
        if r_match.home = any(v_all_teams) then
          v_group_pts := v_group_pts + 3;
        end if;
      elsif r_match.home_score < r_match.away_score then
        if r_match.away = any(v_all_teams) then
          v_group_pts := v_group_pts + 3;
        end if;
      elsif r_match.home_score = r_match.away_score then
        if r_match.home = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
        if r_match.away = any(v_all_teams) then v_group_pts := v_group_pts + 1; end if;
      end if;

      -- Bonus posición final de grupo — solo 1 vez por equipo (evita duplicar al iterar partidos)
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

    -- ── ELIMINATORIAS ──────────────────────────────────────
    for r_match in
      select * from wc_matches
      where status = 'finished' and round in ('r32','r16','qf','sf','final')
    loop
      v_round_pts := case r_match.round
        when 'r32'   then 3
        when 'r16'   then 5
        when 'qf'    then 8
        when 'sf'    then 10
        when 'final' then 15
        else 0
      end;
      v_winner := case
        when r_match.home_score >= r_match.away_score then r_match.home
        else r_match.away
      end;
      if v_winner = any(v_all_teams) then
        v_knockout_pts := v_knockout_pts + v_round_pts;
        if r_match.round = 'final' then
          v_knockout_pts := v_knockout_pts + 20;
        end if;
      end if;
    end loop;

    -- ── DÚO DINÁMICO ────────────────────────────────────────
    -- picks.duo = ["player1_id", "player2_id"]
    -- Puntos = goles + asistencias de cada jugador
    declare
      v_duo_player text;
      v_duo_g_a    int;
    begin
      for v_duo_player in
        select jsonb_array_elements_text(coalesce(v_picks->'duo', '[]'::jsonb))
      loop
        if v_duo_player is not null and v_duo_player <> 'null' then
          select coalesce(goals,0) + coalesce(assists,0)
            into v_duo_g_a
            from wc_player_stats where player_id = v_duo_player;
          v_duo_pts := v_duo_pts + coalesce(v_duo_g_a, 0);
        end if;
      end loop;
    end;

    -- ── GOLEADORES ──────────────────────────────────────────
    -- picks.goalscorer = { "teamId": "playerId" }
    -- +5 si uno acierta el máximo goleador de su equipo
    -- +10 si los dos aciertan
    declare
      v_gs_team      text;
      v_gs_player    text;
      v_gs_correct   int := 0;
      v_gs_max_goals int;
      v_gs_pl_goals  int;
    begin
      for v_gs_team, v_gs_player in
        select key, value
          from jsonb_each_text(coalesce(v_picks->'goalscorer', '{}'::jsonb))
      loop
        select max(goals) into v_gs_max_goals
          from wc_player_stats where team = v_gs_team;
        select coalesce(goals,0) into v_gs_pl_goals
          from wc_player_stats where player_id = v_gs_player;
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

-- ============================================================
-- TRIGGER — recalcular scores automáticamente al actualizar un partido
-- ============================================================
create or replace function trigger_recalculate_on_match()
returns trigger language plpgsql security definer as $$
declare
  r_porra record;
begin
  -- Solo actuar cuando el partido pasa a 'finished'
  if new.status = 'finished' and (old.status is distinct from 'finished') then
    -- Recalcular todas las porras activas
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


-- ============================================================
-- FUNCIÓN — recalcular TODAS las porras activas de una vez
-- Usada por el job automático y disponible para llamar manualmente
-- ============================================================
create or replace function recalculate_all_porras()
returns void language plpgsql security definer as $$
declare
  r record;
begin
  for r in
    select distinct porra_id from picks
  loop
    perform recalculate_scores(r.porra_id);
  end loop;
end;
$$;


-- ============================================================
-- AUTOMATIZACIÓN — pg_cron
-- Requiere: Database → Extensions → activar "pg_cron" en Supabase
--
-- Job 1: cada mañana a las 7:00 UTC (9h España en verano)
--         recalcula todo — safety net por si algún partido
--         se quedó en 'live' o el admin tardó en cerrar el marcador.
--
-- Job 2: trigger ya existente (on_match_finished) cubre el caso
--         en tiempo real cuando el admin marca un partido finished.
--
-- Para activar: pegar las dos líneas de cron.schedule() en el
-- SQL Editor UNA VEZ (después de habilitar la extensión pg_cron).
-- Para ver los jobs:  select * from cron.job;
-- Para borrar un job: select cron.unschedule('recalculate-morning');
-- ============================================================

-- ── PASO 1: activar extensiones (una sola vez)
--   Dashboard → Database → Extensions → activar pg_cron y pg_net

-- ── PASO 2: desplegar la Edge Function
--   supabase functions deploy sync-matches --project-ref jnreyahnzaektdirtzcu
--   supabase secrets set FOOTBALL_DATA_API_KEY=<tu_key> --project-ref jnreyahnzaektdirtzcu

-- ── PASO 3: scheduling — la Edge Function se llama cada 5 minutos.
--   Sustituye PROJECT_ID y SERVICE_ROLE_KEY con los valores reales.
--   SERVICE_ROLE_KEY está en: Dashboard → Settings → API → service_role key.

-- select cron.schedule(
--   'sync-matches',
--   '*/5 * * * *',
--   $$
--     select net.http_post(
--       url     := 'https://jnreyahnzaektdirtzcu.supabase.co/functions/v1/sync-matches',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
--         'Content-Type',  'application/json'
--       ),
--       body    := '{}'::jsonb
--     );
--   $$
-- );

-- Alternativa más simple: guardar la service_role_key como setting de app:
-- alter database postgres set "app.service_role_key" = 'eyJ...TU_SERVICE_ROLE_KEY...';
-- (luego ejecutar el cron.schedule de arriba)

-- Para ver jobs activos:       select * from cron.job;
-- Para ver últimas ejecuciones: select * from cron.job_run_details order by start_time desc limit 20;
-- Para pausar:                 select cron.unschedule('sync-matches');


-- ============================================================
-- DATOS INICIALES — Partidos del Mundial 2026
-- Puedes añadir más cuando se vayan jugando
-- ============================================================
insert into wc_matches (id, home, away, status, match_date, group_code, round) values
  ('m_g_001', 'mex', 'uru', 'upcoming', '2026-06-12 20:00+00', 'A', 'group'),
  ('m_g_002', 'usa', 'can', 'upcoming', '2026-06-12 23:00+00', 'B', 'group'),
  ('m_g_003', 'arg', 'mar', 'upcoming', '2026-06-13 02:00+00', 'C', 'group'),
  ('m_g_004', 'fra', 'bel', 'upcoming', '2026-06-13 18:00+00', 'D', 'group'),
  ('m_g_005', 'esp', 'col', 'upcoming', '2026-06-13 21:00+00', 'E', 'group'),
  ('m_g_006', 'bra', 'ale', 'upcoming', '2026-06-14 00:00+00', 'F', 'group'),
  ('m_g_007', 'eng', 'nld', 'upcoming', '2026-06-14 18:00+00', 'G', 'group'),
  ('m_g_008', 'por', 'ita', 'upcoming', '2026-06-14 21:00+00', 'H', 'group')
on conflict (id) do nothing;
