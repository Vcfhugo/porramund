/* ============================================================
   APP ROOT — con auth Supabase + picks persistentes
   ============================================================ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#336F1B",
  "ambient": true
}/*EDITMODE-END*/;

/* Paleta Brasil 2014 — verde como primary */
const ACCENTS = [
  { hex: '#336F1B', rgb: '51,111,27',   ink: '#fff'    },  // verde brasil
  { hex: '#FDD301', rgb: '253,211,1',   ink: '#2A1A00' },  // amarillo brasil
  { hex: '#D8131A', rgb: '216,19,26',   ink: '#fff'    },  // rojo brasil
  { hex: '#003469', rgb: '0,52,105',    ink: '#fff'    },  // azul editorial
  { hex: '#ABCB2D', rgb: '171,203,45',  ink: '#1D3500' },  // verde lima
];

/* Convierte una porra de Supabase al formato que usan los componentes de UI */
function porraToLeague(porra) {
  const members = porra.memberCount ?? porra.members ?? '?';
  const pot = typeof members === 'number'
    ? `${(porra.price || 10) * members} €`
    : `${porra.price || 10} € × ${members}`;
  return {
    id:      porra.id,
    name:    porra.name,
    members,
    pot,
    me:      '?º',
    color:   '#D8131A',
    code:    porra.code || '',
  };
}

/* Iniciales del nombre del usuario */
function userInitials(user) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (parts[0][0] || '?').toUpperCase();
}

function userName(user) {
  return user?.user_metadata?.full_name || user?.user_metadata?.name ||
         user?.email?.split('@')[0] || 'Jugador';
}

/* On a real touch device render the app filling the viewport, no phone bezel */
function AppFrame({ children }) {
  if (window.IS_REAL_MOBILE) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#000',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    );
  }
  return <IOSDevice dark>{children}</IOSDevice>;
}

function App() {
  const DB = window.DB;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  /* ---- Auth state ---- */
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* ---- Porra activa ---- */
  const [currentPorra, setCurrentPorra] = useState(null);
  const [porraLoading, setPorraLoading]  = useState(false);

  /* ---- Navegación ---- */
  const [onboarded,  setOnboarded]  = useState(false);
  const [tab,        setTab]        = useState('inicio');
  const [league,     setLeague]     = useState(DB.leagues[0]);

  /* ---- Overlays ---- */
  const [showLeagues, setShowLeagues] = useState(false);
  const [showRules,   setShowRules]   = useState(false);
  const [showDraft,   setShowDraft]   = useState(false);
  const [showAdmin,   setShowAdmin]   = useState(false);

  /* ---- Match data (real desde Supabase) ---- */
  const [liveMatches, setLiveMatches] = useState(null); /* null = no cargado aún */

  /* ---- Accent ---- */
  useEffect(() => {
    const a = ACCENTS.find(x => x.hex === t.accent) || ACCENTS[0];
    const r = document.documentElement.style;
    r.setProperty('--lime', a.hex);
    r.setProperty('--lime-rgb', a.rgb);
    r.setProperty('--accent', a.hex);
    r.setProperty('--accent-ink', a.ink);
  }, [t.accent]);

  /* ---- Cargar + suscribir partidos del mundial ---- */
  useEffect(() => {
    if (!window.SB) return;
    let channel = null;

    async function loadAndApply() {
      try {
        const matches = await window.SB.getMatches();
        applyMatches(matches);
      } catch(e) { /* sin conexión, se usa mock */ }
    }

    function applyMatches(matches) {
      /* Reemplaza DB.matches con datos reales formateados para UI */
      if (matches && matches.length > 0) {
        DB.matches = matches.map(m => ({
          id:     m.id,
          g:      m.group_code || '',
          home:   m.home,
          away:   m.away,
          date:   m.match_date ? new Date(m.match_date).toLocaleDateString('es',{day:'2-digit',month:'short'}).toUpperCase() : '',
          time:   m.match_date ? new Date(m.match_date).toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'}) : '',
          venue:  '',
          status: m.status || 'upcoming',
          live:   (m.status === 'live' && m.home_score != null)
                    ? `${m.home_score} - ${m.away_score}` : null,
          min:    m.status === 'live' ? '' : null,
        }));
        /* Actualizar teamPts */
        if (window.computeTeamPts) {
          DB.teamPts = window.computeTeamPts(matches);
        }
        setLiveMatches([...matches]);
      }
    }

    loadAndApply();

    /* Realtime: recargar al cambiar un partido */
    channel = window.SB.subscribeMatches(() => loadAndApply());

    return () => { if (channel) window.sb?.removeChannel(channel); };
  }, []);

  /* ---- Cargar stats de jugadores (goles + asistencias) ---- */
  useEffect(() => {
    if (!window.SB) return;
    let channel = null;

    function applyStats(stats) {
      if (!stats || stats.length === 0) return;
      stats.forEach(({ player_id, goals, assists }) => {
        const pl = DB.players.find(p => p.id === player_id);
        if (pl) { pl.goals = goals || 0; pl.assists = assists || 0; }
      });
    }

    window.SB.getPlayerStats().then(applyStats).catch(() => {});

    channel = window.SB.subscribePlayerStats(payload => {
      const s = payload.new;
      if (s) applyStats([s]);
    });

    return () => { if (channel) window.sb?.removeChannel(channel); };
  }, []);

  /* ---- Inicializar auth ---- */
  useEffect(() => {
    /* Si no hay Supabase configurado, saltamos el auth (modo demo) */
    if (!window.sb || !window.SB) {
      setAuthLoading(false);
      return;
    }

    /* Sesión inicial */
    window.sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadUserPorra();
    });

    /* Escuchar cambios de auth (magic link, Google OAuth callback) */
    const { data: { subscription } } = window.sb.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) loadUserPorra();
        else { setCurrentPorra(null); setLeague(DB.leagues[0]); setOnboarded(false); }
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  /* ---- Cargar porra del usuario ---- */
  const loadUserPorra = async () => {
    if (!window.SB) return;
    setPorraLoading(true);
    try {
      const porras = await window.SB.myPorras();
      if (porras.length > 0) {
        const p = porras[0];
        setCurrentPorra(p);
        window.currentPorraId = p.id;
        setLeague(porraToLeague(p));
        const saved = await window.SB.loadPicks(p.id);
        if (saved?.data) DB.myPicks = saved.data;
        DB.myPicksLocked = saved?.locked === true;
        if (p.config?.porraGroups) DB.porraGroups = p.config.porraGroups;
        setOnboarded(true);
      }
    } catch(e) {
      console.warn('Error cargando porra:', e);
    }
    setPorraLoading(false);
  };

  /* Cuando el usuario crea/une una porra nueva desde el draft o onboarding */
  const handlePorraReady = async (porra) => {
    if (!porra) { setOnboarded(true); return; }
    setCurrentPorra(porra);
    window.currentPorraId = porra.id || null;
    setLeague(porraToLeague(porra));
    if (porra.config?.porraGroups) DB.porraGroups = porra.config.porraGroups;
    if (porra.id && window.SB) {
      try {
        const saved = await window.SB.loadPicks(porra.id);
        if (saved?.data) DB.myPicks = saved.data;
      } catch(e) { /* sin picks previos, ok */ }
    }
    setOnboarded(true);
    setShowDraft(false);
    setTab('predicciones');
  };

  /* ---- Loading ---- */
  if (authLoading || porraLoading) {
    return (
      <React.Fragment>
      <AppFrame>
        <div className="app" style={{ alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:18, background:'var(--lime)',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--accent-ink)', marginBottom:16, marginInline:'auto',
              animation:'blink 1.2s infinite' }}>
              <Icon name="trophy" size={28} />
            </div>
            <p className="mut" style={{ fontWeight:700, fontSize:14, margin:0 }}>
              {authLoading ? 'Comprobando sesión...' : 'Cargando tu porra...'}
            </p>
          </div>
        </div>
      </AppFrame>
      </React.Fragment>
    );
  }

  /* ---- Auth screen (si Supabase está configurado y no hay usuario) ---- */
  const supabaseConfigured = window.SUPABASE_CONFIGURED === true;

  if (supabaseConfigured && !user) {
    return (
      <React.Fragment>
      <AppFrame>
        <div className="app">
          <AuthScreen />
        </div>
      </AppFrame>
      </React.Fragment>
    );
  }

  /* ---- App principal ---- */
  const openRules = () => setShowRules(true);
  const isAdmin   = currentPorra?.created_by === user?.id;

  const displayName = user ? userName(user) : 'Jugador';
  const initials    = user ? userInitials(user) : '?';

  /* Cambiar de porra activa — recarga picks y actualiza todo el estado */
  const handlePorraPick = async (porra) => {
    setShowLeagues(false);
    if (!porra?.id) return;
    setCurrentPorra(porra);
    window.currentPorraId = porra.id;
    setLeague(porraToLeague(porra));
    if (window.SB) {
      try {
        const saved = await window.SB.loadPicks(porra.id);
        DB.myPicks = saved?.data || { g1:[],g2:[],g3:[],g4:[],g5:null,g6:[],goalscorer:{},duo:[null,null] };
      } catch(e) { /* sin picks → limpiar */ DB.myPicks = { g1:[],g2:[],g3:[],g4:[],g5:null,g6:[],goalscorer:{},duo:[null,null] }; }
    }
    /* Forzar re-render con la key de la porra */
    setTab('predicciones');
  };

  const screens = {
    inicio:       <ScreenHome go={setTab} league={league}
                    openLeagues={() => setShowLeagues(true)} openRules={openRules}
                    currentPorra={currentPorra} liveMatches={liveMatches}
                    userName={displayName} userInitials={initials} />,
    predicciones: <ScreenPredict key={currentPorra?.id || 'demo'} openRules={openRules}
                    porraId={currentPorra?.id} />,
    bracket:      <ScreenBracket isAdmin={isAdmin} />,
    ranking:      <ScreenRanking league={league}
                    openLeagues={() => setShowLeagues(true)}
                    currentPorra={currentPorra} />,
    perfil:       <ScreenProfile openLeagues={() => setShowLeagues(true)}
                    openRules={openRules} openDraft={() => setShowDraft(true)}
                    openAdmin={isAdmin ? () => setShowAdmin(true) : null}
                    user={user} isAdmin={isAdmin} currentPorra={currentPorra}
                    userName={displayName} userInitials={initials}
                    onLogout={async () => {
                      if (window.SB) await window.SB.logout();
                      setUser(null); setCurrentPorra(null);
                      setLeague(DB.leagues[0]); setOnboarded(false);
                    }} />,
  };

  const tabs = [
    ['inicio',       'home',   'Inicio'],
    ['predicciones', 'ball',   'Selección'],
    ['bracket',      'trophy', 'Bracket'],
    ['ranking',      'chart',  'Ranking'],
    ['perfil',       'user',   'Perfil'],
  ];

  return (
    <React.Fragment>
    <AppFrame>
      <div className={'app' + (t.ambient ? '' : ' flat')}>

        {onboarded && screens[tab]}

        {onboarded && (
          <div className="tabbar">
            {tabs.map(([k, ic, lbl]) => (
              <button key={k} className={'tab' + (tab === k ? ' on' : '')}
                onClick={() => setTab(k)}>
                <span className="ic">
                  <Icon name={ic} size={k===tab ? 24 : 23} sw={tab===k ? 2.4 : 2} />
                </span>
                <span className="lbl">{lbl}</span>
              </button>
            ))}
          </div>
        )}

        {showLeagues && (
          <LeaguesSheet current={league}
            onPick={handlePorraPick}
            onClose={() => setShowLeagues(false)} />
        )}
        {showRules  && <ScreenRules onClose={() => setShowRules(false)} />}
        {showAdmin  && <ScreenAdmin onClose={() => { setShowAdmin(false); }} porraId={currentPorra?.id} />}
        {showDraft  && (
          <ScreenDraft
            onDone={handlePorraReady}
            onBack={() => setShowDraft(false)} />
        )}

        {!onboarded && (
          <Onboarding
            onDone={() => setOnboarded(true)}
            onPorraReady={handlePorraReady}
            openRules={openRules} />
        )}
      </div>
    </AppFrame>

    <TweaksPanel>
      <TweakSection label="Identidad visual" />
      <TweakColor label="Acento" value={t.accent}
        options={ACCENTS.map(a => a.hex)}
        onChange={(v) => setTweak('accent', v)} />
      {/* Fondo con halos — eliminado en v2, gradientes removidos */}
    </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
