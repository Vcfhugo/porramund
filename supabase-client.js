/* ============================================================
   Porra Mundial 2026 — Cliente Supabase (window.SB)
   ------------------------------------------------------------
   Esta es la capa de datos que conecta toda la UI con Supabase.
   Implementa window.sb (cliente raw), window.SB (API de la app)
   y window.computeTeamPts (puntos por equipo, lado cliente).

   ⚠️  CONFIGURACIÓN — rellena la ANON KEY antes de usar.
       URL y ANON KEY están en: Supabase → Project Settings → API
       La anon key es pública (segura para el frontend).
   ============================================================ */
(function () {
  'use strict';

  // ── 1. CREDENCIALES ───────────────────────────────────────
  const SUPABASE_URL      = 'https://jnreyahnzaektdirtzcu.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpucmV5YWhuemFla3RkaXJ0emN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1NTQ4MDEsImV4cCI6MjA5NjEzMDgwMX0.tUbq-_WizPc6A7X8hgiUdu16vKpyMOiydzmI5df7Al4';   // ← Settings → API → anon public

  // Está configurado si la anon key es un JWT real (las anon keys empiezan por 'eyJ')
  const CONFIGURED = !!(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    SUPABASE_ANON_KEY.startsWith('eyJ') &&
    window.supabase
  );

  window.SUPABASE_CONFIGURED = CONFIGURED;

  if (!CONFIGURED) {
    // Modo demo: la app funciona con los datos mock de data.js
    window.sb = null;
    window.SB = null;
    if (window.supabase) {
      console.info('[Porra] Supabase sin configurar → modo demo (data.js).');
    }
    return;
  }

  // ── 2. CLIENTE RAW ────────────────────────────────────────
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  window.sb = sb;

  // ── 3. HELPERS ────────────────────────────────────────────
  // Nombre visible del usuario logueado (para members.display_name)
  function displayNameFrom(user) {
    return (
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split('@')[0] ||
      'Jugador'
    );
  }

  async function currentUser() {
    const { data } = await sb.auth.getUser();
    return data?.user || null;
  }

  // Genera un código de porra legible (sin caracteres ambiguos)
  function makeCode(len = 6) {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    const buf = new Uint8Array(len);
    (window.crypto || window.msCrypto).getRandomValues(buf);
    for (let i = 0; i < len; i++) s += A[buf[i] % A.length];
    return s;
  }

  // Cuenta miembros de un conjunto de porras → { porraId: n }
  async function memberCounts(porraIds) {
    const out = {};
    if (!porraIds.length) return out;
    const { data } = await sb
      .from('members')
      .select('porra_id')
      .in('porra_id', porraIds);
    (data || []).forEach((r) => {
      out[r.porra_id] = (out[r.porra_id] || 0) + 1;
    });
    return out;
  }

  // ── 4. API DE LA APP (window.SB) ──────────────────────────
  const SB = {
    /* ---------- AUTH ---------- */
    async loginMagicLink(email, name) {
      const redirectTo = window.location.origin + '/auth/callback';
      const { error } = await sb.auth.signInWithOtp({
        email: (email || '').trim(),
        options: { emailRedirectTo: redirectTo, data: { full_name: name || '' } },
      });
      return { error: error ? { message: error.message } : null };
    },

    async loginGoogle() {
      const redirectTo = window.location.origin + '/auth/callback';
      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
      return { error: error ? { message: error.message } : null };
    },

    async logout() {
      await sb.auth.signOut();
    },

    /* ---------- PORRAS ---------- */
    // Porras donde el usuario es miembro
    async myPorras() {
      const user = await currentUser();
      if (!user) return [];

      const { data: mine, error } = await sb
        .from('members')
        .select('porra_id, porras(*)')
        .eq('user_id', user.id);
      if (error) throw error;

      const porras = (mine || []).map((m) => m.porras).filter(Boolean);
      const counts = await memberCounts(porras.map((p) => p.id));

      return porras.map((p) => ({
        id:          p.id,
        name:        p.name,
        code:        p.code,
        price:       p.price ?? 10,
        deadline:    p.deadline,
        config:      p.config || {},
        created_by:  p.created_by,
        memberCount: counts[p.id] || 1,
      }));
    },

    async createPorra(name, price, deadline, config) {
      const user = await currentUser();
      if (!user) throw new Error('Necesitas iniciar sesión.');

      // Código único (reintenta si colisiona)
      let code, inserted, lastErr;
      for (let attempt = 0; attempt < 6; attempt++) {
        code = makeCode();
        const { data, error } = await sb
          .from('porras')
          .insert({
            code,
            name: (name || 'Porra').trim(),
            price: price ?? 10,
            deadline: deadline || null,
            config: config || {},
            created_by: user.id,
          })
          .select()
          .single();
        if (!error) { inserted = data; break; }
        lastErr = error;
        if (!/duplicate|unique/i.test(error.message || '')) throw error;
      }
      if (!inserted) throw lastErr || new Error('No se pudo crear la porra.');

      // El creador se une como miembro
      await sb.from('members').upsert(
        { porra_id: inserted.id, user_id: user.id, display_name: displayNameFrom(user) },
        { onConflict: 'porra_id,user_id' }
      );

      return {
        id:          inserted.id,
        name:        inserted.name,
        code:        inserted.code,
        price:       inserted.price ?? 10,
        deadline:    inserted.deadline,
        config:      inserted.config || {},
        created_by:  inserted.created_by,
        memberCount: 1,
      };
    },

    async joinPorraByCode(code) {
      const user = await currentUser();
      if (!user) throw new Error('Necesitas iniciar sesión.');

      const clean = (code || '').trim().toUpperCase();
      const { data: porra, error } = await sb
        .from('porras')
        .select('*')
        .eq('code', clean)
        .maybeSingle();
      if (error) throw error;
      if (!porra) throw new Error('No existe ninguna porra con ese código.');

      await sb.from('members').upsert(
        { porra_id: porra.id, user_id: user.id, display_name: displayNameFrom(user) },
        { onConflict: 'porra_id,user_id' }
      );

      const counts = await memberCounts([porra.id]);
      return {
        id:          porra.id,
        name:        porra.name,
        code:        porra.code,
        price:       porra.price ?? 10,
        deadline:    porra.deadline,
        config:      porra.config || {},
        created_by:  porra.created_by,
        memberCount: counts[porra.id] || 1,
      };
    },

    /* ---------- MIEMBROS ---------- */
    async getMembers(porraId) {
      if (!porraId) return [];
      const user = await currentUser();

      const { data: members, error } = await sb
        .from('members')
        .select('user_id, display_name, joined_at')
        .eq('porra_id', porraId)
        .order('joined_at', { ascending: true });
      if (error) throw error;

      const { data: picks } = await sb
        .from('picks')
        .select('user_id, data, locked')
        .eq('porra_id', porraId);
      const byUser = {};
      (picks || []).forEach((p) => { byUser[p.user_id] = p; });

      return (members || []).map((m) => ({
        user_id:      m.user_id,
        display_name: m.display_name,
        isMe:         user ? m.user_id === user.id : false,
        picks:        byUser[m.user_id]
                        ? { data: byUser[m.user_id].data || {}, locked: byUser[m.user_id].locked === true }
                        : null,
      }));
    },

    async kickMember(porraId, userId) {
      const { error } = await sb
        .from('members')
        .delete()
        .eq('porra_id', porraId)
        .eq('user_id', userId);
      if (error) throw error;
    },

    /* ---------- PICKS ---------- */
    async loadPicks(porraId) {
      const user = await currentUser();
      if (!user || !porraId) return { data: null, locked: false };
      const { data, error } = await sb
        .from('picks')
        .select('data, locked')
        .eq('porra_id', porraId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return { data: data?.data || null, locked: data?.locked === true };
    },

    async savePicks(porraId, picks) {
      const user = await currentUser();
      if (!user || !porraId) return;
      const { error } = await sb.from('picks').upsert(
        { porra_id: porraId, user_id: user.id, data: picks || {}, updated_at: new Date().toISOString() },
        { onConflict: 'porra_id,user_id' }
      );
      if (error) throw error;
    },

    async lockPicks(porraId) {
      const user = await currentUser();
      if (!user || !porraId) return;
      const { error } = await sb
        .from('picks')
        .update({ locked: true, updated_at: new Date().toISOString() })
        .eq('porra_id', porraId)
        .eq('user_id', user.id);
      if (error) throw error;
    },

    /* ---------- LEADERBOARD ---------- */
    // Devuelve filas con display_name, pts, scores[0].total_pts, rank y me
    async leaderboard(porraId) {
      if (!porraId) return [];
      const user = await currentUser();

      const { data: members, error } = await sb
        .from('members')
        .select('user_id, display_name')
        .eq('porra_id', porraId);
      if (error) throw error;

      const { data: scores } = await sb
        .from('scores')
        .select('user_id, total_pts, breakdown')
        .eq('porra_id', porraId);
      const ptsByUser = {};
      (scores || []).forEach((s) => { ptsByUser[s.user_id] = s.total_pts || 0; });

      const rows = (members || []).map((m) => {
        const pts = ptsByUser[m.user_id] || 0;
        return {
          user_id:      m.user_id,
          display_name: m.display_name,
          pts,
          scores:       [{ total_pts: pts }],
          me:           user ? m.user_id === user.id : false,
        };
      });

      rows.sort((a, b) => b.pts - a.pts);
      rows.forEach((r, i) => { r.rank = i + 1; });
      return rows;
    },

    /* ---------- PARTIDOS ---------- */
    async getMatches() {
      const { data, error } = await sb
        .from('wc_matches')
        .select('*')
        .order('match_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async syncMatches() {
      const { data, error } = await sb.functions.invoke('sync-matches', { body: {} });
      if (error) throw error;
      return data || { synced: 0 };
    },

    subscribeMatches(onChange) {
      const channel = sb
        .channel('wc_matches_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wc_matches' }, () => {
          try { onChange && onChange(); } catch (e) {}
        })
        .subscribe();
      return channel;
    },

    /* ---------- STATS DE JUGADORES ---------- */
    async getPlayerStats() {
      const { data, error } = await sb
        .from('wc_player_stats')
        .select('player_id, goals, assists');
      if (error) throw error;
      return data || [];
    },

    subscribePlayerStats(onChange) {
      const channel = sb
        .channel('wc_player_stats_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wc_player_stats' }, (payload) => {
          try { onChange && onChange(payload); } catch (e) {}
        })
        .subscribe();
      return channel;
    },
  };

  window.SB = SB;

  // ── 5. PUNTOS POR EQUIPO (cliente) ────────────────────────
  // Replica a nivel de equipo la lógica de recalculate_scores (schema.sql)
  // para pintar la contribución de cada selección en la pantalla Inicio.
  // Devuelve { [teamCode]: { group, knockout, total } } (sin multiplicadores).
  const ROUND_PTS = { r32: 3, r16: 5, qf: 8, sf: 10, final: 15 };

  window.computeTeamPts = function computeTeamPts(matches) {
    const pts = {};
    const ensure = (t) => (pts[t] || (pts[t] = { group: 0, knockout: 0, total: 0 }));
    if (!Array.isArray(matches)) return pts;

    const rankedDone = new Set();   // bonus de posición solo 1 vez por equipo

    for (const m of matches) {
      if (m.status !== 'finished') continue;
      const hs = m.home_score, as = m.away_score;
      const round = m.round || 'group';

      if (round === 'group') {
        if (hs != null && as != null) {
          if (hs > as)       ensure(m.home).group += 3;
          else if (hs < as)  ensure(m.away).group += 3;
          else { ensure(m.home).group += 1; ensure(m.away).group += 1; }
        }
        // Bonus posición final de grupo (1º = +5, 2º = +3)
        if (m.home_rank != null && !rankedDone.has(m.home)) {
          rankedDone.add(m.home);
          if (m.home_rank === 1) ensure(m.home).group += 5;
          else if (m.home_rank === 2) ensure(m.home).group += 3;
        }
        if (m.away_rank != null && !rankedDone.has(m.away)) {
          rankedDone.add(m.away);
          if (m.away_rank === 1) ensure(m.away).group += 5;
          else if (m.away_rank === 2) ensure(m.away).group += 3;
        }
      } else if (ROUND_PTS[round] != null && hs != null && as != null) {
        const winner = hs >= as ? m.home : m.away;
        ensure(winner).knockout += ROUND_PTS[round];
        if (round === 'final') ensure(winner).knockout += 20;   // campeón
      }
    }

    Object.values(pts).forEach((p) => { p.total = p.group + p.knockout; });
    return pts;
  };

  console.info('[Porra] Supabase conectado.');
})();
