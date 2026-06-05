/**
 * sync-matches — Edge Function
 *
 * Consulta football-data.org para el Mundial 2026 y sincroniza
 * resultados, estado y clasificación de grupos en wc_matches.
 *
 * Scheduling: se invoca desde pg_cron cada 5 min durante el torneo.
 * También puede llamarse manualmente vía POST desde el panel admin.
 *
 * Variables de entorno necesarias (Supabase → Edge Functions → Secrets):
 *   FOOTBALL_DATA_API_KEY  — de https://www.football-data.org (gratuito)
 *   SUPABASE_URL           — ya existe automáticamente
 *   SUPABASE_SERVICE_ROLE_KEY — ya existe automáticamente
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API_BASE = 'https://api.football-data.org/v4';

/* football-data.org puede tener el WC 2026 bajo distintos códigos.
   Probamos en orden hasta que uno devuelva partidos.              */
const COMPETITION_CANDIDATES = ['WC', 'WC2026', 'FIFA', 'CL2026'];

/* ── Mapa football-data.org TLA → nuestro ID interno ──────────────── */
const TLA_MAP: Record<string, string> = {
  ESP: 'esp', ENG: 'eng', BRA: 'bra', POR: 'por',
  ARG: 'arg', FRA: 'fra', GER: 'ale', NED: 'nld',
  COL: 'col', MAR: 'mar', BEL: 'bel', SUI: 'sui',
  NOR: 'nor', TUR: 'tur', URU: 'uru', SWE: 'swe',
  CRO: 'cro', SEN: 'sen',
  JPN: 'jpn', CAN: 'can', MEX: 'mex', AUT: 'aut',
  USA: 'usa', BIH: 'bih', ECU: 'ecu', CZE: 'cze',
  CIV: 'civ', TUN: 'tun', EGY: 'egy', RSA: 'rsa',
  GHA: 'gha', COD: 'cod', ALG: 'alg',
  SCO: 'sco', AUS: 'aus', PAR: 'par', KSA: 'ksa',
  KOR: 'kor', QAT: 'qat',
  IRQ: 'irq', JOR: 'jor', NZL: 'nzl', CUW: 'cur',
  PAN: 'pan', CPV: 'cpv', IRN: 'irn', IRI: 'irn',
  UZB: 'uzb', HAI: 'hai', HAT: 'hai',
  BOL: 'bol', SLV: 'slv', UGA: 'uga', DEN: 'den',
  POL: 'pol', SRB: 'srb', ITA: 'ita', NGA: 'nig',
  CMR: 'cam', GRE: 'gre', IRL: 'irl', VEN: 'ven',
  CRI: 'crc', WAL: 'wal', HND: 'hnd',
};

function mapTla(tla: string): string {
  return TLA_MAP[tla?.toUpperCase()] ?? tla?.toLowerCase();
}

function mapStatus(status: string): 'upcoming' | 'live' | 'finished' {
  if (['IN_PLAY', 'PAUSED', 'HALFTIME'].includes(status)) return 'live';
  if (status === 'FINISHED')                               return 'finished';
  return 'upcoming';
}

function mapStage(stage: string): string {
  const s = stage?.toUpperCase() ?? '';
  if (s.includes('GROUP'))                                   return 'group';
  if (s.includes('ROUND_OF_32') || s.includes('LAST_32'))   return 'r32';
  if (s.includes('ROUND_OF_16') || s.includes('LAST_16'))   return 'r16';
  if (s.includes('QUARTER'))                                 return 'qf';
  if (s.includes('SEMI'))                                    return 'sf';
  if (s.includes('FINAL'))                                   return 'final';
  return 'group';
}

/* ── Mapa nombre completo API → nuestro player_id ────────────────── */
const PLAYER_NAME_MAP: Record<string, string> = {
  'Lionel Messi': 'messi',           'Lautaro Martínez': 'lautaro',
  'Julián Álvarez': 'julian',        'Alejandro Garnacho': 'garnacho',
  'Paulo Dybala': 'dybala',          'Ángel Di María': 'di_maria',
  'Kylian Mbappé': 'mbappe',         'Antoine Griezmann': 'griezmann',
  'Ousmane Dembélé': 'dembele',      'Marcus Thuram': 'thuram_m',
  'Bradley Barcola': 'barcola',
  'Vinícius Júnior': 'vinicius',     'Rodrygo': 'rodrygo',
  'Raphinha': 'raphinha',            'Endrick': 'endrick',
  'Savinho': 'savinho',              'Gabriel Martinelli': 'martinelli',
  'Estêvão': 'esteao',
  'Harry Kane': 'kane',              'Bukayo Saka': 'saka',
  'Jude Bellingham': 'bellingham',   'Phil Foden': 'foden',
  'Cole Palmer': 'palmer',           'Marcus Rashford': 'rashford',
  'Anthony Gordon': 'gordon',
  'Lamine Yamal': 'yamal',           'Nico Williams': 'williams_n',
  'Álvaro Morata': 'morata',         'Ferran Torres': 'torres_f',
  'Mikel Oyarzabal': 'oyarzabal',    'Dani Olmo': 'olmo',
  'Cristiano Ronaldo': 'ronaldo',    'Rafael Leão': 'leao',
  'Diogo Jota': 'jota',              'Gonçalo Ramos': 'gramos',
  'João Félix': 'felix_j',           'Bruno Fernandes': 'fernandes_b',
  'Jamal Musiala': 'musiala',        'Florian Wirtz': 'wirtz',
  'Kai Havertz': 'havertz_k',        'Niclas Füllkrug': 'fullkrug',
  'Leroy Sané': 'sane',              'Serge Gnabry': 'gnabry',
  'Cody Gakpo': 'gakpo',             'Memphis Depay': 'depay',
  'Joshua Zirkzee': 'zirkzee',       'Donyell Malén': 'malen',
  'Luis Díaz': 'diaz_l',             'James Rodríguez': 'james',
  'Jhon Durán': 'duran_j',           'Rafael Borré': 'borre_r',
  'Youssef En-Nesyri': 'en_nesyri',  'Hakim Ziyech': 'ziyech',
  'Darwin Núñez': 'nunez_d',         'Federico Valverde': 'valverde',
  'Sadio Mané': 'mane',              'Nicolas Jackson': 'nicjackson',
  'Erling Haaland': 'haaland',       'Martin Ødegaard': 'odegaard',
  'Arda Güler': 'ardaguler',         'Kenan Yıldız': 'kenanyildiz',
  'Santiago Giménez': 'gimenez_s',   'Raúl Jiménez': 'jimenez_r',
  'Mohamed Salah': 'salah',          'Omar Marmoush': 'omar_marmoush',
  'Son Heung-min': 'son_hm',
};

function resolvePlayerId(apiName: string, teamId: string): string {
  if (PLAYER_NAME_MAP[apiName]) return PLAYER_NAME_MAP[apiName];
  const lastName = apiName.split(' ').pop()?.toLowerCase() ?? '';
  for (const [name, id] of Object.entries(PLAYER_NAME_MAP)) {
    if (name.toLowerCase().includes(lastName) && lastName.length > 3) return id;
  }
  return `${teamId}_${lastName.replace(/[^a-z]/g, '')}`;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Deno.env.get('FOOTBALL_DATA_API_KEY');
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'FOOTBALL_DATA_API_KEY not set' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  /* ── 1. Obtener partidos del Mundial 2026 desde la API ──────────── */
  let apiMatches: any[] = [];
  let usedCompetition = '';

  for (const code of COMPETITION_CANDIDATES) {
    try {
      const res = await fetch(
        `${API_BASE}/competitions/${code}/matches`,
        { headers: { 'X-Auth-Token': apiKey } }
      );
      if (res.ok) {
        const body = await res.json() as { matches?: any[] };
        if (body.matches && body.matches.length > 0) {
          apiMatches = body.matches;
          usedCompetition = code;
          break;
        }
      }
    } catch (_) { continue; }
  }

  if (apiMatches.length === 0) {
    const compRes  = await fetch(`${API_BASE}/competitions`, { headers: { 'X-Auth-Token': apiKey } });
    const compBody = compRes.ok ? await compRes.json() : {};
    const available = (compBody.competitions ?? []).map((c: any) => `${c.code}:${c.name}`);
    return new Response(
      JSON.stringify({ error: 'WC 2026 no encontrado', tried: COMPETITION_CANDIDATES, available }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  /* ── 2. Cargar partidos existentes en DB para reconciliar IDs ───── *
   *                                                                    *
   *  Problema sin esto:                                                *
   *    DB tiene  m_g_001  (arg vs mar, group)  sembrado manualmente.  *
   *    API devuelve id=456789 para ese mismo partido.                  *
   *    Sin reconciliación la función insertaría fd_456789 → duplicado. *
   *                                                                    *
   *  Solución: construir un mapa "home:away:round" → id existente.    *
   *  Si existe, actualiza esa fila (conserva el ID). Si no, inserta   *
   *  con fd_<externalId>.                                              */
  const { data: existingRows } = await supabase
    .from('wc_matches')
    .select('id, home, away, round');

  /* Clave: "home:away:round" → id existente en DB */
  const existingMap = new Map<string, string>();
  for (const row of (existingRows ?? [])) {
    if (row.home !== '?' && row.away !== '?') {
      existingMap.set(`${row.home}:${row.away}:${row.round}`, row.id);
    }
  }

  /* ── 3. Upsert cada partido de la API ──────────────────────────── */
  let synced = 0;
  const errors: string[] = [];

  for (const m of apiMatches) {
    const home = mapTla(m.homeTeam?.tla ?? m.homeTeam?.shortName ?? '');
    const away = mapTla(m.awayTeam?.tla ?? m.awayTeam?.shortName ?? '');
    if (!home || !away) continue;

    const status    = mapStatus(m.status);
    const round     = mapStage(m.stage);
    const groupCode = m.group?.replace('GROUP_', '') ?? null;
    const homeScore = m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null;
    const awayScore = m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null;

    /* Reutilizar el ID sembrado si existe para este par de equipos y ronda */
    const key   = `${home}:${away}:${round}`;
    const rowId = existingMap.get(key) ?? `fd_${m.id}`;

    const { error } = await supabase.from('wc_matches').upsert({
      id:         rowId,
      home,
      away,
      home_score: status === 'upcoming' ? null : homeScore,
      away_score: status === 'upcoming' ? null : awayScore,
      status,
      round,
      group_code: groupCode,
      match_date: m.utcDate ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

    if (error) errors.push(`${rowId}: ${error.message}`);
    else synced++;
  }

  /* ── 4. Goleadores — sincronizar goals + assists ────────────────── */
  try {
    const scorersRes = await fetch(
      `${API_BASE}/competitions/${usedCompetition}/scorers?limit=100`,
      { headers: { 'X-Auth-Token': apiKey } }
    );
    if (scorersRes.ok) {
      const { scorers } = await scorersRes.json() as { scorers: any[] };
      for (const s of scorers) {
        const teamId   = mapTla(s.team?.tla ?? '');
        const playerId = resolvePlayerId(s.player?.name ?? '', teamId);
        await supabase.from('wc_player_stats').upsert({
          player_id:  playerId,
          team:       teamId,
          goals:      s.goals   ?? 0,
          assists:    s.assists ?? 0,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'player_id' });
      }
    }
  } catch (_) { /* scorers no crítico */ }

  /* ── 5. Clasificación de grupos (home_rank / away_rank) ─────────── */
  try {
    const standingsRes = await fetch(
      `${API_BASE}/competitions/${usedCompetition}/standings`,
      { headers: { 'X-Auth-Token': apiKey } }
    );
    if (standingsRes.ok) {
      const { standings } = await standingsRes.json() as { standings: any[] };
      for (const group of standings) {
        if (group.type !== 'TOTAL') continue;
        const groupCode = group.group?.replace('GROUP_', '') ?? null;
        if (!groupCode) continue;
        for (const row of group.table as any[]) {
          const teamId   = mapTla(row.team?.tla ?? '');
          const position = row.position as number;
          if (!teamId) continue;
          await supabase.from('wc_matches')
            .update({ home_rank: position, updated_at: new Date().toISOString() })
            .eq('home', teamId).eq('round', 'group').eq('group_code', groupCode);
          await supabase.from('wc_matches')
            .update({ away_rank: position, updated_at: new Date().toISOString() })
            .eq('away', teamId).eq('round', 'group').eq('group_code', groupCode);
        }
      }
    }
  } catch (_) { /* standings no disponible al inicio, no crítico */ }

  /* ── 6. Recalcular puntuaciones si algo cambió ──────────────────── */
  if (synced > 0) {
    await supabase.rpc('recalculate_all_porras');
  }

  return new Response(
    JSON.stringify({
      ok: true,
      competition: usedCompetition,
      total:  apiMatches.length,
      synced,
      errors,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
