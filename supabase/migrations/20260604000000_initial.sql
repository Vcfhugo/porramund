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
-- ROW LEVEL SECURITY
-- ============================================================

alter table porras     enable row level security;
alter table members    enable row level security;
alter table picks      enable row level security;
alter table wc_matches enable row level security;
alter table scores     enable row level security;

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

-- Picks: solo el propietario lee/escribe SUS picks
create policy "picks_owner_all" on picks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
-- Los miembros pueden ver los picks de su misma porra (para leaderboard)
create policy "picks_members_read" on picks for select
  using (
    exists (
      select 1 from members
      where members.porra_id = picks.porra_id
        and members.user_id = auth.uid()
    )
  );

-- WC Matches: lectura pública (el admin introduce desde el panel)
create policy "matches_public_read"  on wc_matches for select using (true);
create policy "matches_public_write" on wc_matches for all  using (true);
-- ⚠️ En producción real, restringir escritura solo al admin

-- Scores: lectura pública dentro de la porra
create policy "scores_members_read" on scores for select
  using (
    exists (
      select 1 from members
      where members.porra_id = scores.porra_id
        and members.user_id = auth.uid()
    )
  );
create policy "scores_owner_write" on scores for all
  using (auth.uid() = user_id);


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
  r_pick    record;
  r_match   record;
  v_picks   jsonb;
  v_all_teams text[];   -- todos los equipos elegidos por el jugador
  v_team    text;
  v_group_pts      int;
  v_knockout_pts   int;
  v_goalscorer_pts int;
  v_duo_pts        int;
  v_total          int;
  v_winner         text;
  v_round_pts      int;
begin
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

    -- Recopilar todos los equipos elegidos en una sola array
    v_all_teams := array(
      select t from (
        select jsonb_array_elements_text(v_picks->'g1') as t
        union all select jsonb_array_elements_text(v_picks->'g2')
        union all select jsonb_array_elements_text(v_picks->'g3')
        union all select jsonb_array_elements_text(v_picks->'g4')
        union all select jsonb_array_elements_text(v_picks->'g5')
        union all select jsonb_array_elements_text(v_picks->'g6')
      ) sub
    );

    -- ── FASE DE GRUPOS ──────────────────────────────────────
    for r_match in
      select * from wc_matches
      where status = 'finished' and round = 'group'
    loop
      -- Victoria local (+3 al ganador)
      if r_match.home_score > r_match.away_score then
        if r_match.home = any(v_all_teams) then
          v_group_pts := v_group_pts + 3;
        end if;
      -- Victoria visitante (+3 al ganador)
      elsif r_match.home_score < r_match.away_score then
        if r_match.away = any(v_all_teams) then
          v_group_pts := v_group_pts + 3;
        end if;
      -- Empate (+1 a ambos)
      elsif r_match.home_score = r_match.away_score then
        if r_match.home = any(v_all_teams) then
          v_group_pts := v_group_pts + 1;
        end if;
        if r_match.away = any(v_all_teams) then
          v_group_pts := v_group_pts + 1;
        end if;
      end if;

      -- Bonus posición final de grupo (home_rank / away_rank de wc_matches con round=group)
      -- Se acumula 1 vez por equipo cuando se conoce la posición final
      if r_match.home_rank = 1 and r_match.home = any(v_all_teams) then
        v_group_pts := v_group_pts + 5;
      elsif r_match.home_rank = 2 and r_match.home = any(v_all_teams) then
        v_group_pts := v_group_pts + 3;
      end if;
      if r_match.away_rank = 1 and r_match.away = any(v_all_teams) then
        v_group_pts := v_group_pts + 5;
      elsif r_match.away_rank = 2 and r_match.away = any(v_all_teams) then
        v_group_pts := v_group_pts + 3;
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
      -- El ganador suma los puntos de esa ronda
      v_winner := case
        when r_match.home_score > r_match.away_score then r_match.home
        else r_match.away
      end;
      if v_winner = any(v_all_teams) then
        v_knockout_pts := v_knockout_pts + v_round_pts;
        -- Bonus campeón: el ganador de 'final' suma +20 adicionales
        if r_match.round = 'final' then
          v_knockout_pts := v_knockout_pts + 20;
        end if;
      end if;
    end loop;

    -- ── GOLEADORES (picks.goalscorer = { "teamId": "playerId" }) ─
    -- +5 por cada acierto, +10 si los dos son correctos
    -- (Requiere tabla wc_top_scorers o campo en wc_matches — simplificado
    --  por ahora: admin introduce el resultado en picks.goalscorer_result)
    -- Se activará cuando haya datos de goleadores reales.

    -- ── Multiplicador G5 (Relleno × 2.5) ───────────────────
    -- Los puntos de equipos del grupo 5 se multiplican × 2.5
    -- (La lógica de qué equipos son G5 viene de la config de la porra)
    -- TODO: aplicar el multiplicador cuando la config esté en la porra

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
