-- ============================================================
-- SECURITY PATCH — Porra Mundial 2026
--
-- Vulnerabilidades corregidas:
--   1. wc_matches:      cualquier usuario podía falsificar resultados
--   2. scores:          el dueño podía inflar sus propios puntos
--   3. wc_player_stats: cualquier usuario podía alterar estadísticas
--   4. picks:           no había enforcement del deadline en la DB
-- ============================================================

-- Helper: ¿es el usuario actual creador de alguna porra?
-- SECURITY DEFINER para leer porras sin que RLS interfiera en el helper.
create or replace function is_porra_creator()
returns boolean language sql security definer stable
as $$
  select exists (
    select 1 from porras where created_by = auth.uid()
  );
$$;

-- ── 1. wc_matches ────────────────────────────────────────────
-- Antes: cualquier usuario autenticado podía escribir (using true)
-- Ahora: solo quien sea creador de al menos una porra
drop policy if exists "matches_public_write" on wc_matches;
create policy "matches_admin_write" on wc_matches for all
  using (is_porra_creator())
  with check (is_porra_creator());

-- ── 2. scores ────────────────────────────────────────────────
-- Antes: el propietario podía escribir sus propias puntuaciones
-- Ahora: ninguna policy de escritura para usuarios normales —
--        recalculate_scores es SECURITY DEFINER y bypassa RLS
drop policy if exists "scores_owner_write" on scores;

-- ── 3. wc_player_stats ───────────────────────────────────────
-- Antes: cualquier usuario autenticado podía escribir (using true)
-- Ahora: solo creadores de porra
drop policy if exists "player_stats_service_write" on wc_player_stats;
create policy "player_stats_admin_write" on wc_player_stats for all
  using (is_porra_creator())
  with check (is_porra_creator());

-- ── 4. picks — deadline enforcement ─────────────────────────
-- Sustituye la policy "picks_owner_all" (all = SELECT+INSERT+UPDATE+DELETE)
-- por tres policies separadas con la restricción de deadline.
drop policy if exists "picks_owner_all" on picks;

-- Lectura propia (sin cambios de comportamiento)
create policy "picks_owner_select" on picks for select
  using (auth.uid() = user_id);

-- Insert: solo antes del deadline de la porra
create policy "picks_owner_insert" on picks for insert
  with check (
    auth.uid() = user_id
    and not exists (
      select 1 from porras
      where id = porra_id
        and deadline is not null
        and deadline < now()
    )
  );

-- Update: solo si no está bloqueado y el deadline no ha pasado
create policy "picks_owner_update" on picks for update
  using  (auth.uid() = user_id and locked = false)
  with check (
    auth.uid() = user_id
    and locked = false
    and not exists (
      select 1 from porras
      where id = porra_id
        and deadline is not null
        and deadline < now()
    )
  );
