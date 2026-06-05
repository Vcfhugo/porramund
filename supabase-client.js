/* ============================================================
   SUPABASE CLIENT — Porra Mundial 2026
   Obtén tu URL y ANON KEY en: supabase.com → Settings → API
   ============================================================ */

const SUPABASE_URL      = 'https://jnreyahnzaektdirtzcu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eI39SGBY2EnIeSfd81HKKQ_ouGAWFWs';

window.SUPABASE_CONFIGURED = true;

if (!window.SUPABASE_CONFIGURED) {
  console.info('[Porra] Supabase no configurado — corriendo en modo demo local');
  window.sb = null;
  window.SB = null;
} else {
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken:   true,
      persistSession:     true,
      detectSessionInUrl: true,
    },
  });

  /* ============================================================
     HELPERS — todos los accesos a la DB pasan por aquí
     ============================================================ */
  window.SB = {

    /* ---- AUTH ---- */
    async getUser() {
      const { data: { user } } = await window.sb.auth.getUser();
      return user;
    },

    async loginGoogle() {
      return window.sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
    },

    async loginMagicLink(email, name) {
      return window.sb.auth.signInWithOtp({
        email,
        options: { data: { name } },
      });
    },

    async logout() {
      return window.sb.auth.signOut();
    },

    /* ---- PORRAS ---- */
    async createPorra(name, price, deadline, config) {
      const user = await this.getUser();
      const code = (name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'PORRA') +
                   String(10 + Math.floor(Math.random() * 89));
      const { data, error } = await window.sb.from('porras').insert({
        code, name, price,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        config,
        created_by: user.id,
      }).select().single();
      if (error) throw error;
      await this.joinPorraById(data.id, user);
      return data;
    },

    async joinPorraById(porraId, user) {
      user = user || await this.getUser();
      const displayName = user.user_metadata?.full_name ||
                          user.user_metadata?.name ||
                          user.email?.split('@')[0] || 'Jugador';
      await window.sb.from('members').upsert({
        porra_id: porraId,
        user_id: user.id,
        display_name: displayName,
      }, { onConflict: 'porra_id,user_id' });
    },

    async joinPorraByCode(code) {
      const { data: porra, error } = await window.sb.from('porras')
        .select('*').eq('code', code.toUpperCase().trim()).single();
      if (error || !porra) return null;
      await this.joinPorraById(porra.id);
      return porra;
    },

    async myPorras() {
      const user = await this.getUser();
      if (!user) return [];
      const { data } = await window.sb.from('members')
        .select('porra:porras(*)')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });
      const porras = (data || []).map(m => m.porra).filter(Boolean);
      /* Añadir member count con una query por porra */
      await Promise.all(porras.map(async p => {
        const { count } = await window.sb.from('members')
          .select('*', { count: 'exact', head: true })
          .eq('porra_id', p.id);
        p.memberCount = count || 0;
      }));
      return porras;
    },

    /* ---- PICKS ---- */
    async savePicks(porraId, picks) {
      const user = await this.getUser();
      if (!user || !porraId) return;
      return window.sb.from('picks').upsert({
        porra_id: porraId,
        user_id: user.id,
        data: picks,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'porra_id,user_id' });
    },

    async loadPicks(porraId) {
      const user = await this.getUser();
      if (!user || !porraId) return null;
      const { data } = await window.sb.from('picks')
        .select('data, locked')
        .eq('porra_id', porraId)
        .eq('user_id', user.id)
        .single();
      return data || null;
    },

    async lockPicks(porraId) {
      const user = await this.getUser();
      if (!user || !porraId) return;
      const { error } = await window.sb.from('picks')
        .update({ locked: true, updated_at: new Date().toISOString() })
        .eq('porra_id', porraId)
        .eq('user_id',  user.id);
      if (error) throw error;
    },

    async getMembers(porraId) {
      const user = await this.getUser();
      const [{ data: members }, { data: picksData }] = await Promise.all([
        window.sb.from('members')
          .select('user_id, display_name, joined_at')
          .eq('porra_id', porraId)
          .order('joined_at'),
        window.sb.from('picks')
          .select('user_id, data, locked, updated_at')
          .eq('porra_id', porraId),
      ]);
      const picksMap = {};
      (picksData || []).forEach(p => { picksMap[p.user_id] = p; });
      return (members || []).map(m => ({
        ...m,
        picks: picksMap[m.user_id] || null,
        isMe:  m.user_id === user?.id,
      }));
    },

    async kickMember(porraId, userId) {
      const { error } = await window.sb.from('members')
        .delete()
        .eq('porra_id', porraId)
        .eq('user_id',  userId);
      if (error) throw error;
    },

    /* ---- LEADERBOARD ---- */
    async leaderboard(porraId) {
      const user = await this.getUser();
      const { data } = await window.sb.from('members')
        .select('user_id, display_name, picks(data, locked), scores(total_pts, breakdown)')
        .eq('porra_id', porraId)
        .order('joined_at');
      if (!data) return [];
      /* Ordena por pts DESC, añade flag 'me' y rank */
      const rows = data
        .map(r => ({
          ...r,
          pts:  r.scores?.[0]?.total_pts ?? 0,
          me:   r.user_id === user?.id,
        }))
        .sort((a, b) => b.pts - a.pts)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      return rows;
    },

    /* ---- PARTIDOS ---- */
    async saveMatchResult(matchId, homeScore, awayScore, status) {
      return window.sb.from('wc_matches').upsert({
        id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        status,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    },

    async getMatches() {
      const { data } = await window.sb.from('wc_matches').select('*').order('match_date');
      return data || [];
    },

    /* ---- REALTIME ---- */
    subscribeLeaderboard(porraId, callback) {
      return window.sb.channel(`scores:${porraId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'scores',
          filter: `porra_id=eq.${porraId}`,
        }, callback)
        .subscribe();
    },

    subscribeMatches(callback) {
      return window.sb.channel('wc_matches_live')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'wc_matches',
        }, callback)
        .subscribe();
    },

    /* Stats de jugadores para Dúo Dinámico y Goleadores */
    async getPlayerStats() {
      const { data } = await window.sb
        .from('wc_player_stats')
        .select('player_id, goals, assists');
      return data || [];
    },

    subscribePlayerStats(callback) {
      return window.sb.channel('wc_player_stats_live')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'wc_player_stats',
        }, callback)
        .subscribe();
    },

    /* Invoca la Edge Function sync-matches manualmente */
    async syncMatches() {
      const { data: { session } } = await window.sb.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No autenticado');
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/sync-matches`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  };
}

/* ============================================================
   UTILIDAD — calcular puntos por equipo desde wc_matches
   Usada en el frontend para "Puntos por selección"
   ============================================================ */
window.computeTeamPts = function(matches) {
  const pts = {};
  const init = id => { if (!pts[id]) pts[id] = { group:0, knockout:0, total:0 }; };

  /* Fase de grupos: victorias/empates */
  for (const m of matches) {
    if (m.status !== 'finished' || m.round !== 'group') continue;
    init(m.home); init(m.away);
    if (m.home_score > m.away_score)       pts[m.home].group += 3;
    else if (m.home_score < m.away_score)  pts[m.away].group += 3;
    else {
      if (m.home_score !== null) { pts[m.home].group += 1; pts[m.away].group += 1; }
    }
  }

  /* Bonus de posición final de grupo — solo 1 vez por equipo */
  const bonused = new Set();
  for (const m of matches) {
    if (m.status !== 'finished' || m.round !== 'group') continue;
    if (m.home_rank != null && !bonused.has(m.home)) {
      init(m.home);
      if (m.home_rank === 1)      pts[m.home].group += 5;
      else if (m.home_rank === 2) pts[m.home].group += 3;
      bonused.add(m.home);
    }
    if (m.away_rank != null && !bonused.has(m.away)) {
      init(m.away);
      if (m.away_rank === 1)      pts[m.away].group += 5;
      else if (m.away_rank === 2) pts[m.away].group += 3;
      bonused.add(m.away);
    }
  }

  /* Eliminatorias */
  const roundPts = { r32:3, r16:5, qf:8, sf:10, final:15 };
  for (const m of matches) {
    if (m.status !== 'finished' || m.round === 'group') continue;
    if (m.home_score == null) continue;
    const rp = roundPts[m.round] || 0;
    const winner = m.home_score >= m.away_score ? m.home : m.away;
    init(winner);
    pts[winner].knockout += rp;
    if (m.round === 'final') pts[winner].knockout += 20; /* campeón */
  }

  /* Totales */
  for (const t of Object.keys(pts)) pts[t].total = pts[t].group + pts[t].knockout;
  return pts;
};
