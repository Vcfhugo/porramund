/* ============================================================
   CREAR PARTIDA — wizard simplificado (grupos FIJOS oficiales)
   Paso 1: Configurar nombre / precio / deadline
   Paso 2: Confirmar grupos oficiales + crear
   Paso 3: Código listo para compartir
   ============================================================ */

const GROUP_COLORS = {
  1: { bg:'rgba(253,211,1,.13)',   border:'rgba(253,211,1,.38)',   text:'var(--lime)',   dot:'#FDD301' },
  2: { bg:'rgba(39,229,212,.11)',  border:'rgba(39,229,212,.32)',  text:'var(--cyan)',   dot:'#27E5D4' },
  3: { bg:'rgba(171,203,45,.11)',  border:'rgba(171,203,45,.32)',  text:'var(--green)',  dot:'#ABCB2D' },
  4: { bg:'rgba(247,149,22,.11)',  border:'rgba(247,149,22,.32)',  text:'var(--orange)', dot:'#F79516' },
  5: { bg:'rgba(140,107,255,.11)', border:'rgba(140,107,255,.32)', text:'var(--violet)', dot:'#8C6BFF' },
  6: { bg:'rgba(216,19,26,.11)',   border:'rgba(216,19,26,.32)',   text:'var(--coral)',  dot:'#D8131A' },
};

function genCodeLocal() {
  const words = ['CRACK','GOLES','MUNDO','CAMPE','PORRA','DRAFT','FUBOL','FINAL'];
  return words[Math.floor(Math.random() * words.length)] + (10 + Math.floor(Math.random() * 89));
}

async function shareCode(code, porraName) {
  const text = `¡Únete a mi porra del Mundial 2026! 🏆\n\nCódigo: ${code}\nPorra: ${porraName}\n\nAbre la app, pulsa "Unirse con un código" e introduce el código.`;
  if (navigator.share) {
    try { await navigator.share({ title: 'Porra del Mundial 2026', text }); return; }
    catch(e) { /* cancelado */ }
  }
  /* Fallback: copiar al portapapeles */
  try {
    await navigator.clipboard.writeText(code);
    return 'copied';
  } catch(e) { return 'error'; }
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */
function ScreenDraft({ onDone, onBack }) {
  const DB = window.DB;
  const [step,    setStep]    = useState(1);   // 1=config  2=confirm  3=done
  const [config,  setConfig]  = useState({ name:'', price:10, deadline:'2026-06-11' });
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [copied,  setCopied]  = useState(false);
  const [realPorra, setRealPorra] = useState(null);   // porra creada en Supabase
  const [localCode] = useState(genCodeLocal);         // código demo (sin Supabase)

  const finalCode = realPorra?.code || localCode;
  const groups    = DB.porraGroups;  // siempre los grupos oficiales fijos

  /* ---- STEP 1: Configuración ---- */
  if (step === 1) {
    return (
      <div className="ob">
        <DraftHeader title="Nueva partida" step="1 de 2" onBack={onBack} />
        <div className="scroll no-sb" style={{ flex:1, padding:'8px 24px' }}>

          <DraftLabel>Nombre de la porra</DraftLabel>
          <input className="field" placeholder="Los Cracks del Finde" value={config.name}
            onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && config.name.trim() && setStep(2)} />

          <DraftLabel style={{ marginTop:22 }}>Precio de entrada</DraftLabel>
          <div className="chips no-sb" style={{ padding:0, gap:8 }}>
            {[5, 10, 20, 50].map(v => (
              <button key={v} className={'chip' + (config.price === v ? ' on' : '')}
                onClick={() => setConfig(c => ({ ...c, price: v }))}>{v} €</button>
            ))}
          </div>

          <DraftLabel style={{ marginTop:22 }}>Fecha límite de inscripción</DraftLabel>
          <input className="field" type="date" value={config.deadline}
            onChange={e => setConfig(c => ({ ...c, deadline: e.target.value }))}
            style={{ fontFamily:"'Brasil2014Numeros',monospace" }} />

          {/* Resumen bote estimado */}
          <div style={{ marginTop:22, padding:'14px 16px', background:'rgba(var(--lime-rgb),.07)',
            borderRadius:16, border:'1px solid rgba(var(--lime-rgb),.2)' }}>
            <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
              <div className="col" style={{ gap:2 }}>
                <span style={{ fontWeight:700, fontSize:13 }}>Bote con 10 jugadores</span>
                <span className="mut" style={{ fontSize:11.5, fontWeight:600 }}>
                  Cierre: {config.deadline || '11/06/2026'} · 17:00 h
                </span>
              </div>
              <span className="bignum" style={{ fontSize:22, color:'var(--lime)' }}>
                {config.price * 10} €
              </span>
            </div>
          </div>

          <div style={{ height:20 }} />
        </div>
        <div style={{ padding:'12px 24px 40px' }}>
          <button className="btn btn-accent"
            style={{ opacity: config.name.trim() ? 1 : 0.4 }}
            disabled={!config.name.trim()}
            onClick={() => setStep(2)}>
            Ver grupos oficiales <Icon name="chevron" size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ---- STEP 2: Confirm + grupos oficiales ---- */
  if (step === 2) {
    const handleCreate = async () => {
      setLoading(true);
      setErr('');
      try {
        if (window.SB) {
          const porra = await window.SB.createPorra(
            config.name.trim(),
            config.price,
            config.deadline,
            { porraGroups: groups }
          );
          setRealPorra(porra);
        }
        setStep(3);
      } catch(e) {
        setErr(e.message || 'Error al crear la porra. Inténtalo de nuevo.');
      }
      setLoading(false);
    };

    return (
      <div className="ob">
        <DraftHeader title="Confirmar" step="2 de 2" onBack={() => setStep(1)} />
        <div className="scroll no-sb" style={{ flex:1, padding:'8px 20px' }}>

          {/* Resumen configuración */}
          <div className="card" style={{ padding:'14px 16px', marginBottom:14 }}>
            <div className="row" style={{ justifyContent:'space-between', marginBottom:8 }}>
              <span style={{ fontWeight:900, fontSize:18, letterSpacing:'-.02em' }}>{config.name}</span>
              <span className="bignum" style={{ fontSize:18, color:'var(--lime)' }}>{config.price} €</span>
            </div>
            <div className="row gap14" style={{ flexWrap:'wrap' }}>
              <div className="row gap6">
                <Icon name="users" size={14} style={{ color:'var(--muted)' }} />
                <span className="mut" style={{ fontSize:12, fontWeight:700 }}>11 picks / jugador</span>
              </div>
              <div className="row gap6">
                <Icon name="clock" size={14} style={{ color:'var(--muted)' }} />
                <span className="mut" style={{ fontSize:12, fontWeight:700 }}>Cierre {config.deadline}</span>
              </div>
            </div>
          </div>

          {/* Grupos oficiales — solo lectura */}
          <div className="mut up" style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em',
            margin:'0 0 10px', padding:'0 2px' }}>Grupos oficiales (fijos)</div>
          {groups.map(g => {
            const gc = GROUP_COLORS[g.id];
            return (
              <div key={g.id} style={{ marginBottom:10 }}>
                <div className="card" style={{ overflow:'hidden', borderColor: gc.border }}>
                  <div style={{ padding:'9px 14px', borderBottom:'1px solid var(--line)',
                    background: gc.bg, display:'flex', alignItems:'center', gap:9 }}>
                    <div style={{ width:28, height:28, borderRadius:7, flexShrink:0,
                      background: gc.text + '22',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color: gc.text }}>
                      <Icon name={g.icon || 'trophy'} size={15} />
                    </div>
                    <div className="col" style={{ flex:1, gap:0 }}>
                      <div className="row gap8">
                        <span style={{ fontWeight:900, fontSize:13.5, color: gc.text }}>
                          G{g.id} · {g.name}
                        </span>
                        {g.multiplier > 1 && (
                          <span style={{ background:'rgba(247,149,22,.25)', color:'var(--orange)',
                            fontWeight:900, fontSize:10, padding:'1px 6px', borderRadius:5,
                            fontFamily:"'Brasil2014Numeros',monospace" }}>×{g.multiplier}</span>
                        )}
                      </div>
                      <span className="mut" style={{ fontSize:11, fontWeight:700 }}>
                        {g.teams.length} equipos · cada jugador elige {g.pick === 1 ? '1 (Relleno)' : g.pick}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding:'8px 12px', display:'flex', flexWrap:'wrap', gap:6 }}>
                    {g.teams.map(tid => {
                      const t = DB.T[tid];
                      if (!t) return null;
                      return (
                        <div key={tid} style={{ display:'flex', alignItems:'center', gap:5,
                          padding:'4px 8px', background:'var(--surface-2)',
                          borderRadius:8, border:'1px solid var(--line-2)' }}>
                          <Flag team={t} size={16} />
                          <span style={{ fontWeight:700, fontSize:11.5 }}>{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {err && (
            <p style={{ color:'var(--coral)', fontSize:13, fontWeight:700,
              textAlign:'center', margin:'8px 0' }}>{err}</p>
          )}
          <div style={{ height:20 }} />
        </div>
        <div style={{ padding:'12px 20px 40px', display:'flex', flexDirection:'column', gap:10 }}>
          <button className="btn btn-accent" onClick={handleCreate} disabled={loading}>
            {loading
              ? <><span className="blink" style={{ width:8,height:8,borderRadius:'50%',background:'currentColor' }} /> Creando...</>
              : <><Icon name="check" size={20} /> Crear porra y obtener código</>
            }
          </button>
          <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>
            <Icon name="chevron" size={16} style={{ transform:'rotate(180deg)' }} /> Modificar
          </button>
        </div>
      </div>
    );
  }

  /* ---- STEP 3: Done — código listo ---- */
  const handleShare = async () => {
    const result = await shareCode(finalCode, config.name);
    if (result === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2500); }
  };

  return (
    <div className="ob">
      <div className="safe-top" />
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        justifyContent:'center', padding:'0 28px', textAlign:'center' }}>

        <div style={{ width:88, height:88, borderRadius:28, background:'var(--lime)',
          display:'flex', alignItems:'center', justifyContent:'center', color:'var(--accent-ink)',
          marginBottom:24, boxShadow:'0 8px 32px rgba(var(--lime-rgb),.4)' }}>
          <Icon name="trophy" size={44} />
        </div>

        <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-.02em', margin:0 }}>
          ¡Porra creada!
        </h1>
        <p className="mut" style={{ fontSize:15, fontWeight:600, margin:'10px 0 28px',
          maxWidth:280, lineHeight:1.5 }}>
          Comparte el código con tus amigos para que se unan a{' '}
          <b style={{ color:'var(--text)' }}>{config.name}</b>
        </p>

        {/* Código — toca para copiar */}
        <button onClick={handleShare} style={{
          background:'var(--surface-2)', border:'2px dashed rgba(var(--lime-rgb),.45)',
          borderRadius:20, padding:'20px 40px', marginBottom:8,
          cursor:'pointer', fontFamily:'inherit', width:'100%',
        }}>
          <span className="mono" style={{ fontSize:36, fontWeight:700, letterSpacing:'.3em', color:'var(--lime)' }}>
            {finalCode}
          </span>
        </button>
        <span className="mut" style={{ fontSize:12, fontWeight:700, marginBottom:24 }}>
          {copied ? '✓ Código copiado al portapapeles' : 'Toca el código para copiar · o comparte abajo'}
        </span>

        <div className="row gap20">
          {[
            [groups.reduce((s,g) => s+g.teams.length, 0), 'equipos'],
            [config.price + ' €', 'entrada'],
            ['11', 'picks'],
          ].map(([v, l]) => (
            <div key={l} className="col" style={{ alignItems:'center', gap:2 }}>
              <span className="bignum" style={{ fontSize:22, color:'var(--lime)' }}>{v}</span>
              <span className="mut up" style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'0 24px 40px', display:'flex', flexDirection:'column', gap:11 }}>
        <button className="btn btn-ghost" onClick={handleShare}>
          <Icon name="share" size={19} />
          {copied ? '¡Código copiado!' : 'Compartir invitación'}
        </button>
        <button className="btn btn-accent" onClick={() => {
          onDone(realPorra || { id:null, config:{ porraGroups: groups }, name: config.name, code: finalCode });
        }}>
          Empezar a pronosticar <Icon name="chevron" size={18} />
        </button>
      </div>
    </div>
  );
}

/* ---- Sub-componentes ---- */
function DraftHeader({ title, step, onBack }) {
  return (
    <>
      <div className="safe-top" />
      <div className="row" style={{ padding:'6px 20px 16px', gap:12, alignItems:'center', flexShrink:0 }}>
        <button className="icon-btn" onClick={onBack}>
          <Icon name="chevron" size={18} style={{ transform:'rotate(180deg)' }} />
        </button>
        <span style={{ fontWeight:900, fontSize:18, flex:1, letterSpacing:'-.02em' }}>{title}</span>
        {step && <span className="mut" style={{ fontSize:12.5, fontWeight:700 }}>{step}</span>}
      </div>
    </>
  );
}

function DraftLabel({ children, style }) {
  return (
    <div className="up" style={{ fontSize:11, fontWeight:800, letterSpacing:'.1em',
      color:'var(--muted)', margin:'0 0 10px', ...style }}>{children}</div>
  );
}

Object.assign(window, { ScreenDraft });
