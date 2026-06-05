-- ============================================================
-- CRON AUTO-SYNC — Porra Mundial 2026
--
-- Llama a la Edge Function sync-matches cada 5 minutos.
-- La función consulta football-data.org y actualiza wc_matches,
-- wc_player_stats y recalcula puntuaciones automáticamente.
--
-- ── REQUISITOS PREVIOS (ejecutar UNA VEZ en SQL Editor) ───────
--
-- 1. Habilitar extensiones en el Dashboard:
--    Database → Extensions → pg_cron  ✓
--    Database → Extensions → pg_net   ✓
--
-- 2. Guardar la service_role_key como setting de DB:
--    (Settings → API → service_role key)
--
--    alter database postgres
--      set "app.service_role_key" = 'eyJ...TU_SERVICE_ROLE_KEY...';
--
-- 3. Asegurarse de que la Edge Function está desplegada y el secret
--    FOOTBALL_DATA_API_KEY está configurado:
--
--    supabase functions deploy sync-matches \
--      --project-ref jnreyahnzaektdirtzcu
--
--    supabase secrets set FOOTBALL_DATA_API_KEY=<tu_key> \
--      --project-ref jnreyahnzaektdirtzcu
--
-- ── API KEY GRATUITA ──────────────────────────────────────────
--    Regístrate en https://www.football-data.org
--    Plan gratuito: 10 req/min — suficiente para el cron de 5 min.
--
-- ── GESTIÓN DEL JOB ──────────────────────────────────────────
--    Ver jobs activos:        select * from cron.job;
--    Ver últimas ejecuciones: select * from cron.job_run_details
--                               order by start_time desc limit 20;
--    Pausar:                  select cron.unschedule('sync-matches');
--    Forzar sync manual:      select cron.schedule('sync-now','* * * * *',...)
--                             (y borrarlo después)
-- ============================================================

-- ── Activar extensiones ───────────────────────────────────────
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ── Eliminar job anterior si existe (idempotente) ─────────────
select cron.unschedule('sync-matches') where exists (
  select 1 from cron.job where jobname = 'sync-matches'
);

-- ── Crear el cron job: cada 5 minutos ─────────────────────────
select cron.schedule(
  'sync-matches',
  '*/5 * * * *',
  $$
    select net.http_post(
      url     := 'https://jnreyahnzaektdirtzcu.supabase.co/functions/v1/sync-matches',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type',  'application/json'
      ),
      body    := '{}'::jsonb
    );
  $$
);
