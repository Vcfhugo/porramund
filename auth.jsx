/* ============================================================
   AUTH SCREEN — Google + magic link email
   ============================================================ */
function AuthScreen({ onAuth }) {
  const [email,   setEmail]   = useState('');
  const [name,    setName]    = useState('');
  const [step,    setStep]    = useState('login'); // login | sent
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');

  const loginGoogle = async () => {
    setLoading(true);
    setErr('');
    const { error } = await window.SB.loginGoogle();
    if (error) { setErr(error.message); setLoading(false); }
    // Si no hay error, redirige a OAuth — el onAuthStateChange en App lo captura al volver
  };

  const loginEmail = async () => {
    if (!email) return;
    setLoading(true);
    setErr('');
    const { error } = await window.SB.loginMagicLink(email, name);
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setStep('sent');
  };

  /* ---- Email enviado ---- */
  if (step === 'sent') {
    return (
      <div className="ob" style={{ textAlign:'center' }}>
        <div className="safe-top" />
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', padding:'0 28px' }}>
          <div style={{ width:80, height:80, borderRadius:24, background:'rgba(var(--lime-rgb),.12)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'var(--lime)', marginBottom:20, marginInline:'auto',
            border:'2px solid rgba(var(--lime-rgb),.25)' }}>
            <Icon name="mail" size={38} sw={1.8} />
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, letterSpacing:'-.02em', margin:0 }}>
            Revisa tu email
          </h1>
          <p className="mut" style={{ fontSize:15, fontWeight:600,
            margin:'12px 0 0', lineHeight:1.5, maxWidth:280, marginInline:'auto' }}>
            Te hemos enviado un enlace mágico a{' '}
            <b style={{ color:'var(--text)' }}>{email}</b>
          </p>
          <p className="mut" style={{ fontSize:13, fontWeight:600, marginTop:10 }}>
            Toca el enlace del email para entrar.
          </p>
        </div>
        <div style={{ padding:'0 24px 40px' }}>
          <button className="btn btn-ghost" onClick={() => setStep('login')}>
            <Icon name="chevron" size={16} style={{ transform:'rotate(180deg)' }} /> Volver
          </button>
        </div>
      </div>
    );
  }

  /* ---- Login principal ---- */
  return (
    <div className="ob" style={{ background:'var(--ink)' }}>

      {/* ── Cabecera dorada — Brasil 2014: amarillo + verde + navy ── */}
      <div style={{
        background: '#FDD301',
        borderBottom: '3px solid #336F1B',
        padding: '52px 28px 28px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Figuras geométricas — verdes y navy sobre dorado */}
        <GeomCorner size={130} color="#336F1B" position="tr" />
        <GeomCorner size={90}  color="#003469" position="bl" />
        {/* Sunburst detrás del título */}
        <div style={{ position:'absolute', right:-10, top:10, pointerEvents:'none' }}>
          <SunBurst size={160} color="#336F1B" rays={16} opacity={0.18} />
        </div>
        {/* Círculo decorativo grande */}
        <div style={{
          position:'absolute', left:-30, bottom:-50,
          width:140, height:140, borderRadius:'50%',
          background:'rgba(0,52,105,.12)',
          pointerEvents:'none',
        }} />

        {/* Badge evento */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7,
          background:'rgba(0,52,105,.14)', color:'#003469',
          padding:'5px 12px', borderRadius:999, marginBottom:18,
          fontSize:11, fontWeight:800, letterSpacing:'.07em',
          border:'1px solid rgba(0,52,105,.28)' }}>
          <Icon name="trophy" size={14} /> USA · CANADÁ · MÉXICO 2026
        </div>

        <h1 style={{ fontFamily:"'Brasil2014Numeros','Arial Narrow',Impact,sans-serif",
          fontSize:56, letterSpacing:'.04em', lineHeight:.92,
          margin:0, color:'#003469' }}>
          La porra<br />
          <span style={{ color:'#336F1B' }}>del Mundial</span>
        </h1>
        <p style={{ fontSize:14, fontWeight:600, color:'rgba(0,52,105,.78)',
          lineHeight:1.45, margin:'12px 0 0', maxWidth:280 }}>
          Entra para guardar tus selecciones y competir con tus amigos.
        </p>
      </div>

      <BrasilBand />

      {/* Área central — stats de la porra + patrón de fondo */}
      <div style={{
        flex:1, display:'flex', flexDirection:'column',
        justifyContent:'center', padding:'20px 24px',
        background:`var(--ink) var(--pattern-folk)`,
        gap:12,
      }}>
        {[
          { ic:'trophy', val:'6',  lbl:'Grupos de selección',     col:'var(--lime)',   bg:'rgba(51,111,27,.09)' },
          { ic:'ball',   val:'11', lbl:'Equipos por participante', col:'var(--navy)',   bg:'rgba(0,52,105,.07)' },
          { ic:'coin',   val:'10€',lbl:'Entrada · bote entre amigos', col:'var(--coral)', bg:'rgba(216,19,26,.08)' },
        ].map(({ ic, val, lbl, col, bg }) => (
          <div key={lbl} style={{
            display:'flex', alignItems:'center', gap:14,
            background:bg, border:`1px solid ${col}22`,
            borderRadius:14, padding:'12px 16px',
          }}>
            <div style={{ width:36, height:36, borderRadius:10, background:col+'22',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:col, flexShrink:0 }}>
              <Icon name={ic} size={20} sw={1.8} />
            </div>
            <div>
              <div style={{
                fontFamily:"'Brasil2014Numeros','Brasil2014Numeros',sans-serif",
                fontSize:28, fontWeight:400, color:col, lineHeight:1, letterSpacing:'.02em',
              }}>{val}</div>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--muted)', marginTop:2 }}>{lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Formulario ── */}
      <div style={{ padding:'16px 24px 20px', display:'flex', flexDirection:'column', gap:10,
        background:'var(--surface)', borderTop:'2px solid var(--line-2)' }}>

        {/* Google */}
        <button className="btn btn-ghost" onClick={loginGoogle}
          disabled={loading} style={{ gap:12 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink:0 }}>
            <path fill="#4285F4" d="M23.74 12.27c0-.79-.07-1.54-.19-2.27H12v4.3h6.57a5.6 5.6 0 01-2.44 3.68v3.06h3.95c2.32-2.13 3.66-5.28 3.66-8.77z"/>
            <path fill="#34A853" d="M12 24c3.3 0 6.07-1.09 8.1-2.96l-3.95-3.06a7.19 7.19 0 01-10.73-3.77H1.4v3.16A12 12 0 0012 24z"/>
            <path fill="#FBBC05" d="M5.42 14.21A7.19 7.19 0 015.04 12c0-.77.13-1.52.38-2.21V6.63H1.4A12 12 0 000 12c0 1.93.46 3.76 1.4 5.37l4.02-3.16z"/>
            <path fill="#EA4335" d="M12 4.75c1.86 0 3.53.64 4.84 1.9l3.63-3.63C18.06 1.09 15.3 0 12 0 7.35 0 3.28 2.67 1.4 6.63l4.02 3.16A7.2 7.2 0 0112 4.75z"/>
          </svg>
          Entrar con Google
        </button>

        {/* Divider */}
        <div className="row" style={{ gap:10, alignItems:'center' }}>
          <div style={{ flex:1, height:1, background:'var(--line-2)' }} />
          <span className="mut" style={{ fontSize:12, fontWeight:700 }}>o con email</span>
          <div style={{ flex:1, height:1, background:'var(--line-2)' }} />
        </div>

        <input className="field" type="text" placeholder="Tu nombre (para la clasificación)"
          value={name} onChange={e => setName(e.target.value)} />
        <input className="field" type="email" placeholder="tu@email.com"
          value={email} onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loginEmail()} />

        <button className="btn btn-accent" onClick={loginEmail}
          disabled={loading || !email}
          style={{ opacity: email ? 1 : 0.4, height:52, fontSize:16 }}>
          {loading ? 'Enviando...' : 'Recibir enlace mágico →'}
        </button>

        {err && (
          <p style={{ color:'var(--coral)', fontSize:13, fontWeight:600,
            textAlign:'center', margin:0 }}>{err}</p>
        )}
      </div>

      {/* ── Banda inferior de colores — carnaval Brasil ── */}
      <div style={{ height:5, display:'flex', flexShrink:0 }}>
        <div style={{ flex:1, background:'var(--lime)' }} />
        <div style={{ flex:1, background:'var(--gold)' }} />
        <div style={{ flex:1, background:'var(--coral)' }} />
        <div style={{ flex:1, background:'var(--orange)' }} />
        <div style={{ flex:1, background:'var(--green)' }} />
        <div style={{ flex:1, background:'var(--navy)' }} />
      </div>
    </div>
  );
}

window.AuthScreen = AuthScreen;
