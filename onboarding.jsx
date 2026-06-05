/* ============================================================
   ONBOARDING — crear o unirse a una porra
   ============================================================ */
function Onboarding({ onDone, onPorraReady, openRules }) {
  const [step,    setStep]    = useState('welcome');
  const [name,    setName]    = useState('');
  const [code,    setCode]    = useState('');
  const [joining, setJoining] = useState(false);
  const [joinErr, setJoinErr] = useState('');

  // WELCOME
  if (step === 'welcome') {
    return (
      <div className="ob" style={{ background:'var(--ink)' }}>
        {/* ── Hero dorado — Brasil 2014: amarillo + verde + navy ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'56px 28px 28px',
          position:'relative', overflow:'hidden',
          background:'#FDD301', borderBottom:'3px solid #336F1B' }}>

          {/* Figuras geométricas — verdes y navy sobre dorado */}
          <GeomCorner size={160} color="#336F1B" position="tr" />
          <GeomCorner size={100} color="#003469" position="bl" />
          <div style={{ position:'absolute', right:10, top:30, pointerEvents:'none' }}>
            <SunBurst size={200} color="#336F1B" rays={16} opacity={0.16} />
          </div>
          <div style={{ position:'absolute', left:-40, bottom:0, pointerEvents:'none' }}>
            <SunBurst size={150} color="#003469" rays={12} opacity={0.12} />
          </div>
          {/* Círculo decorativo izquierda */}
          <div style={{ position:'absolute', left:-20, top:'40%', width:120, height:120,
            borderRadius:'50%', background:'rgba(0,52,105,.12)', pointerEvents:'none' }} />

          <div style={{ position:'relative' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, alignSelf:'flex-start',
              background:'rgba(0,52,105,.14)', color:'#003469',
              padding:'6px 13px', borderRadius:999, marginBottom:18,
              fontSize:11, fontWeight:800, letterSpacing:'.07em',
              border:'1px solid rgba(0,52,105,.28)' }}>
              <Icon name="trophy" size={14} /> USA · CANADÁ · MÉXICO 2026
            </div>
            <h1 style={{ fontFamily:'var(--font-poster)', fontSize:72, fontWeight:400,
              letterSpacing:'.04em', lineHeight:.92, margin:'0 0 16px', color:'#003469' }}>
              La porra<br />del <span style={{ color:'#336F1B' }}>Mundial</span>
            </h1>
            <p style={{ fontSize:15, fontWeight:600, lineHeight:1.45, margin:0,
              maxWidth:280, color:'rgba(0,52,105,.78)' }}>
              Pronostica los 104 partidos, monta tu liga con amigos y pelea por el bote.
            </p>
            <div className="row" style={{ gap:24, marginTop:24 }}>
              {[['104', 'partidos'], ['48', 'selecciones'], ['1', 'campeón']].map(([n, l]) => (
                <div key={l} className="col" style={{ gap:2 }}>
                  <span className="bignum" style={{ fontSize:38, color:'#003469', lineHeight:1 }}>{n}</span>
                  <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em',
                    textTransform:'uppercase', color:'rgba(0,52,105,.65)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <BrasilBand />

        <div style={{ padding:'20px 24px 40px', display:'flex', flexDirection:'column', gap:11,
          background:'var(--ink)' }}>
          <button className="btn btn-accent" onClick={() => setStep('draft')}>
            <Icon name="plus" size={20} /> Crear una porra
          </button>
          <button className="btn btn-ghost" onClick={() => setStep('join')}>
            <Icon name="qr" size={19} /> Unirse con un código
          </button>
          <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, marginTop: 6, cursor: 'pointer' }}>
            Explorar la app →
          </button>
        </div>
      </div>
    );
  }

  // CREATE — delega al wizard de draft completo
  if (step === 'draft') {
    return (
      <ScreenDraft
        onDone={(porra) => {
          // Después de crear los grupos, ir a picks (ScreenPredict)
          if (onPorraReady && porra) onPorraReady(porra);
          else onDone();
        }}
        onBack={() => setStep('welcome')}
      />
    );
  }

  // JOIN
  if (step === 'join') {
    const handleJoin = async () => {
      if (code.length < 3) return;
      setJoining(true);
      setJoinErr('');
      try {
        if (window.SB) {
          const porra = await window.SB.joinPorraByCode(code);
          if (!porra) { setJoinErr('Código no encontrado. Revísalo e inténtalo de nuevo.'); setJoining(false); return; }
          if (onPorraReady) { onPorraReady(porra); return; }
        } else {
          // Modo demo sin Supabase: simular unión con picks vacíos
          if (onPorraReady) { onPorraReady({ id: null, config: { porraGroups: window.DB.porraGroups }, name: 'Demo' }); return; }
        }
        onDone();
      } catch(e) {
        setJoinErr('Error al unirse: ' + e.message);
      }
      setJoining(false);
    };

    return (
      <div className="ob">
        <ObHeader title="Unirse a porra" onBack={() => setStep('welcome')} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px' }} className="no-sb">
          <Label>Código de invitación</Label>
          <input className="field code" placeholder="CRACK26" maxLength={8} value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setJoinErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()} />
          <p className="mut" style={{ fontSize: 13, fontWeight: 600, textAlign: 'center', marginTop: 14 }}>
            Pídele el código a quien creó la porra
          </p>
          {joinErr && (
            <p style={{ color:'var(--coral)', fontSize:13, fontWeight:600,
              textAlign:'center', marginTop:10 }}>{joinErr}</p>
          )}
        </div>
        <div style={{ padding: '12px 24px 40px' }}>
          <button className="btn btn-accent"
            style={{ opacity: code.length >= 3 ? 1 : .4 }}
            disabled={code.length < 3 || joining}
            onClick={handleJoin}>
            {joining ? 'Buscando...' : 'Unirme a la porra'}
          </button>
        </div>
      </div>
    );
  }

  // READY (código generado)
  return (
    <div className="ob">
      <div className="safe-top" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 28, background: 'var(--lime)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0a0e18', marginBottom: 24 }}>
          <Icon name="check" size={48} sw={2.6} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-.02em', margin: 0 }}>¡Porra creada!</h1>
        <p className="mut" style={{ fontSize: 15, fontWeight: 600, margin: '10px 0 26px', maxWidth: 280 }}>
          Comparte este código para que tus amigos se unan a <b style={{ color: 'var(--text)' }}>{name || 'tu porra'}</b>
        </p>
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--line-2)', borderRadius: 18, padding: '18px 30px' }}>
          <span className="mono" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '.3em', color: 'var(--lime)' }}>GANA26</span>
        </div>
      </div>
      <div style={{ padding: '0 24px 40px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <button className="btn btn-ghost"><Icon name="share" size={19} /> Compartir invitación</button>
        <button className="btn btn-accent" onClick={onDone}>Empezar a pronosticar</button>
      </div>
    </div>
  );
}

function ObHeader({ title, onBack, step }) {
  return (
    <>
      <div className="safe-top" />
      <div className="row" style={{ padding: '6px 20px 16px', gap: 12, alignItems: 'center' }}>
        <button className="icon-btn" onClick={onBack}><Icon name="chevron" size={18} style={{ transform: 'rotate(180deg)' }} /></button>
        <span style={{ fontWeight: 800, fontSize: 18, flex: 1 }}>{title}</span>
        {step && <span className="mut" style={{ fontSize: 12.5, fontWeight: 700 }}>{step}</span>}
      </div>
    </>
  );
}
function Label({ children, style }) {
  return <div className="up" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.1em', color: 'var(--muted)', margin: '0 0 10px', ...style }}>{children}</div>;
}

/* ============================================================
   Sheet — selector / crear ligas
   ============================================================ */
function LeaguesSheet({ current, onPick, onClose }) {
  const DB = window.DB;
  const [porras,  setPorras]  = useState(null);  // null = cargando
  const [subView, setSubView] = useState(null);  // 'create' | 'join'
  const [joinCode, setJoinCode] = useState('');
  const [joining,  setJoining]  = useState(false);
  const [joinErr,  setJoinErr]  = useState('');

  useEffect(() => {
    if (!window.SB) {
      /* Modo demo: convertir DB.leagues al formato correcto */
      setPorras(DB.leagues.map(l => ({ ...l, _raw: l })));
      return;
    }
    window.SB.myPorras().then(ps => {
      if (ps.length === 0) {
        setPorras([]);
        return;
      }
      setPorras(ps.map(p => ({
        id:      p.id,
        name:    p.name,
        members: p.memberCount ?? '?',
        pot:     p.price && p.memberCount ? `${p.price * p.memberCount} €` : `${p.price || 10} €`,
        code:    p.code || '',
        color:   '#D8131A',
        me:      '?º',
        _raw:    p,   /* objeto completo para handlePorraPick */
      })));
    }).catch(() => setPorras([]));
  }, []);

  const handleJoin = async () => {
    if (joinCode.length < 3) return;
    setJoining(true);
    setJoinErr('');
    try {
      if (window.SB) {
        const porra = await window.SB.joinPorraByCode(joinCode);
        if (!porra) { setJoinErr('Código no encontrado.'); setJoining(false); return; }
        onPick(porra);
      } else {
        onClose();
      }
    } catch(e) { setJoinErr('Error: ' + e.message); }
    setJoining(false);
  };

  /* Vista: unirse con código */
  if (subView === 'join') {
    return (
      <div className="sheet-bg" onClick={onClose}>
        <div className="sheet no-sb" onClick={e => e.stopPropagation()}>
          <div className="grab" />
          <div className="row gap10" style={{ marginBottom:16, alignItems:'center' }}>
            <button className="icon-btn" onClick={() => setSubView(null)} style={{ marginLeft:-4 }}>
              <Icon name="chevron" size={18} style={{ transform:'rotate(180deg)' }} />
            </button>
            <h3 style={{ fontSize:20, fontWeight:800, margin:0, letterSpacing:'-.02em' }}>Unirse con código</h3>
          </div>
          <input className="field code" placeholder="CRACK26" maxLength={8}
            value={joinCode} onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            style={{ textAlign:'center', fontSize:22, letterSpacing:'.2em',
              fontFamily:"'Brasil2014Numeros',monospace", fontWeight:700 }} />
          {joinErr && <p style={{ color:'var(--coral)', fontSize:13, fontWeight:600,
            textAlign:'center', marginTop:8 }}>{joinErr}</p>}
          <button className="btn btn-accent" style={{ marginTop:14, opacity: joinCode.length>=3?1:.4 }}
            disabled={joinCode.length < 3 || joining} onClick={handleJoin}>
            {joining ? 'Buscando...' : 'Unirme a la porra'}
          </button>
        </div>
      </div>
    );
  }

  const COLORS = ['#D8131A','#27E5D4','#8C6BFF','#F79516','#ABCB2D','#4DA6FF'];

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet no-sb" onClick={e => e.stopPropagation()}>
        <div className="grab" />
        <h3 style={{ fontSize:21, fontWeight:800, margin:'4px 0 16px', letterSpacing:'-.02em' }}>Mis porras</h3>

        <div className="col" style={{ gap:10 }}>
          {porras === null ? (
            <p className="mut" style={{ fontSize:13, fontWeight:600, textAlign:'center', margin:'20px 0' }}>
              Cargando...
            </p>
          ) : porras.length === 0 ? (
            <p className="mut" style={{ fontSize:13, fontWeight:600, textAlign:'center', margin:'12px 0' }}>
              Aún no estás en ninguna porra.
            </p>
          ) : porras.map((l, i) => {
            const on  = current?.id === l.id;
            const col = l.color || COLORS[i % COLORS.length];
            return (
              <button key={l.id || i} onClick={() => onPick(l._raw || l)} className="card" style={{
                border: on ? '1.5px solid var(--lime)' : '1px solid var(--line)',
                background: on ? 'rgba(var(--lime-rgb),.07)' : 'var(--surface)',
                cursor:'pointer', textAlign:'left', color:'inherit',
                fontFamily:'inherit', padding:14,
                display:'flex', alignItems:'center', gap:13,
              }}>
                <div style={{ width:44, height:44, borderRadius:13, background:col,
                  display:'flex', alignItems:'center', justifyContent:'center', flex:'none' }}>
                  <Icon name="users" size={22} style={{ color:'#0a0e18' }} />
                </div>
                <div className="col" style={{ flex:1, gap:2 }}>
                  <span style={{ fontWeight:800, fontSize:15 }}>{l.name}</span>
                  <span className="mut" style={{ fontSize:12, fontWeight:600 }}>
                    {typeof l.members === 'number' ? `${l.members} jugadores · ` : ''}Bote {l.pot}
                  </span>
                  {l.code && (
                    <span style={{ fontSize:11, fontWeight:700, color:'var(--muted-2)',
                      fontFamily:"'Brasil2014Numeros',monospace", letterSpacing:'.08em' }}>#{l.code}</span>
                  )}
                </div>
                {on && <Icon name="check" size={22} style={{ color:'var(--lime)' }} />}
              </button>
            );
          })}
        </div>

        <div className="row gap10" style={{ marginTop:16 }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => { onClose(); }}>
            <Icon name="plus" size={19} /> Crear
          </button>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setSubView('join')}>
            <Icon name="qr" size={18} /> Unirme
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Onboarding, LeaguesSheet });
