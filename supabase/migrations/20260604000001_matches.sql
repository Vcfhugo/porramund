-- ============================================================
-- PARTIDOS FASE DE GRUPOS — Mundial 2026
-- Ejecutar en: Supabase → SQL Editor → Run
--
-- 12 grupos × 6 partidos = 72 partidos de grupos
-- IDs m_g_001..m_g_008 ya existen en la migración inicial (on conflict do nothing)
--
-- Equipos en DB.T (los que los jugadores pueden elegir):
--   arg fra bra eng esp por  (Grasa Papa)
--   ale nld bel cro          (Europeos)
--   usa mex can uru col      (Américas)
--   jpn mar sen ecu          (Guerreros)
--   kor sui den aus gha pol  (Relleno)
--   tur srb ita nig cam      (Valientes)
--
-- Equipos marcados (*) no están en DB — son relleno para completar grupos de 4.
-- Actualiza los (*) con los equipos reales del sorteo si los conoces.
-- ============================================================

insert into wc_matches (id, home, away, status, match_date, group_code, round) values

-- ============================================================
-- GRUPO A — mex, uru + bol(*), pan(*)
-- Fechas aprox: MD1=Jun 12-13 · MD2=Jun 17-18 · MD3=Jun 22-23
-- ============================================================
  ('m_g_001', 'mex', 'uru', 'upcoming', '2026-06-12 20:00+00', 'A', 'group'),  -- ya existe
  ('m_gA_02', 'bol', 'pan', 'upcoming', '2026-06-12 23:00+00', 'A', 'group'),  -- (*)
  ('m_gA_03', 'mex', 'bol', 'upcoming', '2026-06-17 18:00+00', 'A', 'group'),
  ('m_gA_04', 'uru', 'pan', 'upcoming', '2026-06-17 21:00+00', 'A', 'group'),
  ('m_gA_05', 'mex', 'pan', 'upcoming', '2026-06-22 20:00+00', 'A', 'group'),
  ('m_gA_06', 'uru', 'bol', 'upcoming', '2026-06-22 20:00+00', 'A', 'group'),

-- ============================================================
-- GRUPO B — usa, can + hnd(*), slv(*)
-- ============================================================
  ('m_g_002', 'usa', 'can', 'upcoming', '2026-06-12 23:00+00', 'B', 'group'),  -- ya existe
  ('m_gB_02', 'hnd', 'slv', 'upcoming', '2026-06-13 02:00+00', 'B', 'group'),  -- (*)
  ('m_gB_03', 'usa', 'hnd', 'upcoming', '2026-06-17 23:00+00', 'B', 'group'),
  ('m_gB_04', 'can', 'slv', 'upcoming', '2026-06-18 02:00+00', 'B', 'group'),
  ('m_gB_05', 'usa', 'slv', 'upcoming', '2026-06-22 23:00+00', 'B', 'group'),
  ('m_gB_06', 'can', 'hnd', 'upcoming', '2026-06-22 23:00+00', 'B', 'group'),

-- ============================================================
-- GRUPO C — arg, mar + chi(*), sau(*)
-- ============================================================
  ('m_g_003', 'arg', 'mar', 'upcoming', '2026-06-13 02:00+00', 'C', 'group'),  -- ya existe
  ('m_gC_02', 'chi', 'sau', 'upcoming', '2026-06-13 18:00+00', 'C', 'group'),  -- (*)
  ('m_gC_03', 'arg', 'chi', 'upcoming', '2026-06-18 18:00+00', 'C', 'group'),
  ('m_gC_04', 'mar', 'sau', 'upcoming', '2026-06-18 21:00+00', 'C', 'group'),
  ('m_gC_05', 'arg', 'sau', 'upcoming', '2026-06-23 18:00+00', 'C', 'group'),
  ('m_gC_06', 'mar', 'chi', 'upcoming', '2026-06-23 18:00+00', 'C', 'group'),

-- ============================================================
-- GRUPO D — fra, bel + alg(*), tun(*)
-- ============================================================
  ('m_g_004', 'fra', 'bel', 'upcoming', '2026-06-13 18:00+00', 'D', 'group'),  -- ya existe
  ('m_gD_02', 'alg', 'tun', 'upcoming', '2026-06-13 21:00+00', 'D', 'group'),  -- (*)
  ('m_gD_03', 'fra', 'alg', 'upcoming', '2026-06-18 18:00+00', 'D', 'group'),
  ('m_gD_04', 'bel', 'tun', 'upcoming', '2026-06-18 21:00+00', 'D', 'group'),
  ('m_gD_05', 'fra', 'tun', 'upcoming', '2026-06-23 21:00+00', 'D', 'group'),
  ('m_gD_06', 'bel', 'alg', 'upcoming', '2026-06-23 21:00+00', 'D', 'group'),

-- ============================================================
-- GRUPO E — esp, col + ven(*), crc(*)
-- ============================================================
  ('m_g_005', 'esp', 'col', 'upcoming', '2026-06-13 21:00+00', 'E', 'group'),  -- ya existe
  ('m_gE_02', 'ven', 'crc', 'upcoming', '2026-06-14 00:00+00', 'E', 'group'),  -- (*)
  ('m_gE_03', 'esp', 'ven', 'upcoming', '2026-06-19 18:00+00', 'E', 'group'),
  ('m_gE_04', 'col', 'crc', 'upcoming', '2026-06-19 21:00+00', 'E', 'group'),
  ('m_gE_05', 'esp', 'crc', 'upcoming', '2026-06-24 18:00+00', 'E', 'group'),
  ('m_gE_06', 'col', 'ven', 'upcoming', '2026-06-24 18:00+00', 'E', 'group'),

-- ============================================================
-- GRUPO F — bra, ale + egy(*), wal(*)
-- ============================================================
  ('m_g_006', 'bra', 'ale', 'upcoming', '2026-06-14 00:00+00', 'F', 'group'),  -- ya existe
  ('m_gF_02', 'egy', 'wal', 'upcoming', '2026-06-14 18:00+00', 'F', 'group'),  -- (*)
  ('m_gF_03', 'bra', 'egy', 'upcoming', '2026-06-19 21:00+00', 'F', 'group'),
  ('m_gF_04', 'ale', 'wal', 'upcoming', '2026-06-20 00:00+00', 'F', 'group'),
  ('m_gF_05', 'bra', 'wal', 'upcoming', '2026-06-24 21:00+00', 'F', 'group'),
  ('m_gF_06', 'ale', 'egy', 'upcoming', '2026-06-24 21:00+00', 'F', 'group'),

-- ============================================================
-- GRUPO G — eng, nld + irl(*), irn(*)
-- ============================================================
  ('m_g_007', 'eng', 'nld', 'upcoming', '2026-06-14 18:00+00', 'G', 'group'),  -- ya existe
  ('m_gG_02', 'irl', 'irn', 'upcoming', '2026-06-14 21:00+00', 'G', 'group'),  -- (*)
  ('m_gG_03', 'eng', 'irl', 'upcoming', '2026-06-20 18:00+00', 'G', 'group'),
  ('m_gG_04', 'nld', 'irn', 'upcoming', '2026-06-20 18:00+00', 'G', 'group'),
  ('m_gG_05', 'eng', 'irn', 'upcoming', '2026-06-25 21:00+00', 'G', 'group'),
  ('m_gG_06', 'nld', 'irl', 'upcoming', '2026-06-25 21:00+00', 'G', 'group'),

-- ============================================================
-- GRUPO H — por, ita + gre(*), sco(*)
-- ============================================================
  ('m_g_008', 'por', 'ita', 'upcoming', '2026-06-14 21:00+00', 'H', 'group'),  -- ya existe
  ('m_gH_02', 'gre', 'sco', 'upcoming', '2026-06-15 00:00+00', 'H', 'group'),  -- (*)
  ('m_gH_03', 'por', 'gre', 'upcoming', '2026-06-20 21:00+00', 'H', 'group'),
  ('m_gH_04', 'ita', 'sco', 'upcoming', '2026-06-21 00:00+00', 'H', 'group'),
  ('m_gH_05', 'por', 'sco', 'upcoming', '2026-06-25 18:00+00', 'H', 'group'),
  ('m_gH_06', 'ita', 'gre', 'upcoming', '2026-06-25 18:00+00', 'H', 'group'),

-- ============================================================
-- GRUPO I — cro, jpn, tur, srb  (todos en DB)
-- ============================================================
  ('m_gI_01', 'cro', 'jpn', 'upcoming', '2026-06-15 18:00+00', 'I', 'group'),
  ('m_gI_02', 'tur', 'srb', 'upcoming', '2026-06-15 21:00+00', 'I', 'group'),
  ('m_gI_03', 'cro', 'tur', 'upcoming', '2026-06-21 18:00+00', 'I', 'group'),
  ('m_gI_04', 'jpn', 'srb', 'upcoming', '2026-06-21 18:00+00', 'I', 'group'),
  ('m_gI_05', 'cro', 'srb', 'upcoming', '2026-06-26 18:00+00', 'I', 'group'),
  ('m_gI_06', 'jpn', 'tur', 'upcoming', '2026-06-26 18:00+00', 'I', 'group'),

-- ============================================================
-- GRUPO J — sen, ecu, cam, nig  (todos en DB)
-- ============================================================
  ('m_gJ_01', 'sen', 'ecu', 'upcoming', '2026-06-15 21:00+00', 'J', 'group'),
  ('m_gJ_02', 'cam', 'nig', 'upcoming', '2026-06-16 00:00+00', 'J', 'group'),
  ('m_gJ_03', 'sen', 'cam', 'upcoming', '2026-06-21 21:00+00', 'J', 'group'),
  ('m_gJ_04', 'ecu', 'nig', 'upcoming', '2026-06-21 21:00+00', 'J', 'group'),
  ('m_gJ_05', 'sen', 'nig', 'upcoming', '2026-06-26 21:00+00', 'J', 'group'),
  ('m_gJ_06', 'ecu', 'cam', 'upcoming', '2026-06-26 21:00+00', 'J', 'group'),

-- ============================================================
-- GRUPO K — kor, sui, den, pol  (todos en DB)
-- ============================================================
  ('m_gK_01', 'kor', 'sui', 'upcoming', '2026-06-16 18:00+00', 'K', 'group'),
  ('m_gK_02', 'den', 'pol', 'upcoming', '2026-06-16 21:00+00', 'K', 'group'),
  ('m_gK_03', 'kor', 'den', 'upcoming', '2026-06-22 18:00+00', 'K', 'group'),
  ('m_gK_04', 'sui', 'pol', 'upcoming', '2026-06-22 18:00+00', 'K', 'group'),
  ('m_gK_05', 'kor', 'pol', 'upcoming', '2026-06-27 18:00+00', 'K', 'group'),
  ('m_gK_06', 'sui', 'den', 'upcoming', '2026-06-27 18:00+00', 'K', 'group'),

-- ============================================================
-- GRUPO L — aus, gha + zaf(*), nzl(*)
-- ============================================================
  ('m_gL_01', 'aus', 'gha', 'upcoming', '2026-06-16 21:00+00', 'L', 'group'),
  ('m_gL_02', 'zaf', 'nzl', 'upcoming', '2026-06-17 00:00+00', 'L', 'group'),  -- (*)
  ('m_gL_03', 'aus', 'zaf', 'upcoming', '2026-06-22 21:00+00', 'L', 'group'),
  ('m_gL_04', 'gha', 'nzl', 'upcoming', '2026-06-22 21:00+00', 'L', 'group'),
  ('m_gL_05', 'aus', 'nzl', 'upcoming', '2026-06-27 21:00+00', 'L', 'group'),
  ('m_gL_06', 'gha', 'zaf', 'upcoming', '2026-06-27 21:00+00', 'L', 'group')

on conflict (id) do nothing;


-- ============================================================
-- ELIMINATORIAS — placeholders (rellena cuando se conozcan los cruces)
-- El admin introduce el resultado cuando se juegue cada partido.
-- IDs: m_r32_01..16 · m_r16_01..08 · m_qf_01..04 · m_sf_01..02 · m_final
-- ============================================================

-- Crea las 16 filas de R32 como placeholders (home/away con '?' hasta confirmar)
insert into wc_matches (id, home, away, status, round) values
  ('m_r32_01', '?', '?', 'upcoming', 'r32'),
  ('m_r32_02', '?', '?', 'upcoming', 'r32'),
  ('m_r32_03', '?', '?', 'upcoming', 'r32'),
  ('m_r32_04', '?', '?', 'upcoming', 'r32'),
  ('m_r32_05', '?', '?', 'upcoming', 'r32'),
  ('m_r32_06', '?', '?', 'upcoming', 'r32'),
  ('m_r32_07', '?', '?', 'upcoming', 'r32'),
  ('m_r32_08', '?', '?', 'upcoming', 'r32'),
  ('m_r32_09', '?', '?', 'upcoming', 'r32'),
  ('m_r32_10', '?', '?', 'upcoming', 'r32'),
  ('m_r32_11', '?', '?', 'upcoming', 'r32'),
  ('m_r32_12', '?', '?', 'upcoming', 'r32'),
  ('m_r32_13', '?', '?', 'upcoming', 'r32'),
  ('m_r32_14', '?', '?', 'upcoming', 'r32'),
  ('m_r32_15', '?', '?', 'upcoming', 'r32'),
  ('m_r32_16', '?', '?', 'upcoming', 'r32'),
  ('m_r16_01', '?', '?', 'upcoming', 'r16'),
  ('m_r16_02', '?', '?', 'upcoming', 'r16'),
  ('m_r16_03', '?', '?', 'upcoming', 'r16'),
  ('m_r16_04', '?', '?', 'upcoming', 'r16'),
  ('m_r16_05', '?', '?', 'upcoming', 'r16'),
  ('m_r16_06', '?', '?', 'upcoming', 'r16'),
  ('m_r16_07', '?', '?', 'upcoming', 'r16'),
  ('m_r16_08', '?', '?', 'upcoming', 'r16'),
  ('m_qf_01',  '?', '?', 'upcoming', 'qf'),
  ('m_qf_02',  '?', '?', 'upcoming', 'qf'),
  ('m_qf_03',  '?', '?', 'upcoming', 'qf'),
  ('m_qf_04',  '?', '?', 'upcoming', 'qf'),
  ('m_sf_01',  '?', '?', 'upcoming', 'sf'),
  ('m_sf_02',  '?', '?', 'upcoming', 'sf'),
  ('m_final',  '?', '?', 'upcoming', 'final')
on conflict (id) do nothing;
