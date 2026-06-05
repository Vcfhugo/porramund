/* ============================================================
   Pantalla REGLAMENTO OFICIAL
   ============================================================ */
function ScreenRules({ onClose }) {
  const DB = window.DB;
  const sc = DB.scoring;

  return (
    <div className="ob" style={{ zIndex: 95, overflowY: 'auto' }}>
      <div className="safe-top" />

      {/* header */}
      <div className="row" style={{ padding:'6px 20px 16px', gap:12, alignItems:'center', flexShrink:0 }}>
        <button className="icon-btn" onClick={onClose}>
          <Icon name="chevron" size={18} style={{ transform:'rotate(180deg)' }} />
        </button>
        <div className="col" style={{ flex:1, gap:1 }}>
          <span style={{ fontWeight:900, fontSize:19, letterSpacing:'-.02em' }}>Reglamento Oficial</span>
          <span className="mut" style={{ fontSize:12, fontWeight:600 }}>Lee bien antes de inscribirte</span>
        </div>
        <span className="tag tag-pts">Mundial 2026</span>
      </div>

      {/* ---- Inscripción ---- */}
      <RuleSection icon="coin" color="var(--lime)" label="Inscripción">
        <RuleItem left={<RulePts color="lime">{sc.price} €</RulePts>}>
          <b>Precio por participante</b>
        </RuleItem>
        <RuleItem left={<RulePts color="lime">11</RulePts>}>
          <b>Selecciones por participante</b>: 2 equipos de los grupos 1, 2, 3, 4 y 6 + 1 del Grupo 5 (Relleno Mundialero)
        </RuleItem>
      </RuleSection>

      {/* ---- Cómo elegir ---- */}
      <RuleSection icon="users" color="var(--orange)" label="Cómo elegir tus selecciones">
        {DB.porraGroups.map(g => (
          <RuleItem key={g.id}
            left={
              <div style={{ width:38, height:38, borderRadius:9, flexShrink:0,
                background:(g.col||'var(--orange)')+'22',
                display:'flex', alignItems:'center', justifyContent:'center',
                color: g.col || 'var(--orange)',
              }}>
                <Icon name={g.icon || 'trophy'} size={19} />
              </div>
            }>
            <b>Grupo {g.id} · {g.name}</b>
            <span className="mut" style={{ fontSize:12, display:'block', marginTop:2 }}>
              {g.id === 5
                ? `Elige 1 selección de entre ${g.teams.length} equipos`
                : `Elige 2 selecciones de entre ${g.teams.length} equipos`}
            </span>
          </RuleItem>
        ))}
      </RuleSection>

      {/* ---- Puntuación fase de grupos ---- */}
      <RuleSection icon="chart" color="var(--navy)" label="Puntuación en fase de grupos">
        <RuleItem left={<RulePts color="navy">+{sc.groupPhase.win}</RulePts>}>
          <b>Victoria</b> de tu selección → {sc.groupPhase.win} pts directos a tu marcador
        </RuleItem>
        <RuleItem left={<RulePts color="navy">+{sc.groupPhase.draw}</RulePts>}>
          <b>Empate</b> de tu selección → {sc.groupPhase.draw} pt directo a tu marcador
        </RuleItem>
        <RuleItem left={<RulePts color="lime">+{sc.groupPhase.first}</RulePts>}>
          <b>1.º de grupo</b> → {sc.groupPhase.first} puntos extra
        </RuleItem>
        <RuleItem left={<RulePts color="lime">+{sc.groupPhase.second}</RulePts>}>
          <b>2.º de grupo</b> → {sc.groupPhase.second} puntos extra
        </RuleItem>
      </RuleSection>

      {/* ---- Puntos eliminatorias ---- */}
      <RuleSection icon="bracket" color="var(--violet)" label="Puntos por eliminatorias">
        {[
          ['Dieciseisavos', sc.knockouts.r32],
          ['Octavos',       sc.knockouts.r16],
          ['Cuartos',       sc.knockouts.qf],
          ['Semifinal',     sc.knockouts.sf],
          ['Final',         sc.knockouts.final],
          ['Campeón',       sc.knockouts.champ],
        ].map(([rnd, pts]) => (
          <RuleItem key={rnd} left={<RulePts color="violet">+{pts}</RulePts>}>
            Tu selección supera los <b>{rnd}</b>
          </RuleItem>
        ))}
      </RuleSection>

      {/* ---- Máximo goleador Grupo 1 ---- */}
      <RuleSection icon="target" color="var(--lime)" label="Máximo goleador del Grupo 1">
        <RuleItem>
          <p className="mut" style={{ margin:'0 0 10px', fontSize:13, fontWeight:600, lineHeight:1.5 }}>
            De las 2 selecciones que elijas del <b style={{ color:'var(--lime)' }}>Grupo 1 (La Grasa Papa)</b>,
            deberás indicar quién será el máximo goleador de cada una en el torneo.
          </p>
        </RuleItem>
        <RuleItem left={<RulePts color="lime">+{sc.goalscorer.one}</RulePts>}>
          Aciertas el goleador de <b>una</b> de tus dos selecciones
        </RuleItem>
        <RuleItem left={<RulePts color="lime">+{sc.goalscorer.both}</RulePts>}>
          Aciertas el goleador de <b>las dos</b> selecciones del Grupo 1
        </RuleItem>
      </RuleSection>

      {/* ---- Dúo Dinámico ---- */}
      <RuleSection icon="sparkle" color="var(--orange)" label="El Dúo Dinámico">
        <RuleItem>
          <p className="mut" style={{ margin:0, fontSize:13, fontWeight:600, lineHeight:1.5 }}>
            Elige <b style={{ color:'var(--text)' }}>2 jugadores</b> del mundial.
            Solo <b style={{ color:'var(--orange)' }}>1</b> puede pertenecer a una selección del Grupo 1.
          </p>
          <p className="mut" style={{ margin:'8px 0 0', fontSize:13, fontWeight:600, lineHeight:1.5 }}>
            A lo largo de todo el torneo, se suman los <b style={{ color:'var(--text)' }}>goles + asistencias</b> de
            ambos jugadores. Ese total son los <b style={{ color:'var(--orange)' }}>puntos extra</b> que
            se añaden a tu marcador.
          </p>
        </RuleItem>
        {/* ejemplo */}
        <RuleItem>
          <div className="card" style={{ padding:'12px 14px', background:'var(--surface-2)', width:'100%' }}>
            <span className="mut up" style={{ fontSize:10, letterSpacing:'.1em', fontWeight:800 }}>Ejemplo</span>
            <div className="col" style={{ gap:6, marginTop:8 }}>
              {[
                ['L. Yamal', '3G + 2A', 5],
                ['J. Doku',  '1G + 3A', 4],
              ].map(([n,s,p]) => (
                <div key={n} className="row" style={{ justifyContent:'space-between' }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{n}</span>
                  <span className="mut" style={{ fontSize:12 }}>{s}</span>
                  <span className="bignum" style={{ fontSize:14, color:'var(--orange)' }}>+{p} pts</span>
                </div>
              ))}
              <div className="divline" style={{ margin:'4px 0' }} />
              <div className="row" style={{ justifyContent:'space-between' }}>
                <span style={{ fontWeight:800, fontSize:13 }}>Total Dúo Dinámico</span>
                <span className="bignum" style={{ fontSize:16, color:'var(--lime)' }}>+9 pts</span>
              </div>
            </div>
          </div>
        </RuleItem>
      </RuleSection>

      {/* ---- Desempate ---- */}
      <RuleSection icon="trophy" color="var(--gold)" label="Criterio de desempate">
        <RuleItem>
          <p className="mut" style={{ margin:0, fontSize:13, fontWeight:600, lineHeight:1.5 }}>
            En caso de empate a puntos, se comparan las 2 selecciones del <b style={{ color:'var(--lime)' }}>Grupo 1</b>.
            Se suman los <b style={{ color:'var(--text)' }}>goles a favor</b> de esas dos selecciones en todo el torneo.
            Gana el participante con más goles acumulados.
          </p>
        </RuleItem>
      </RuleSection>

      {/* ---- Fecha límite ---- */}
      <div style={{ padding:'14px 20px 0' }}>
        <div style={{
          borderRadius: 'var(--r-lg)', padding:'16px 18px',
          background:'linear-gradient(135deg, rgba(216,19,26,.18), rgba(216,19,26,.05) 60%)',
          border:'1px solid rgba(216,19,26,.35)',
        }}>
          <div className="row gap10" style={{ marginBottom:8 }}>
            <Icon name="clock" size={20} style={{ color:'var(--coral)', flexShrink:0 }} />
            <span style={{ fontWeight:900, fontSize:16, color:'var(--coral)' }}>Fecha límite de inscripción</span>
          </div>
          <p style={{ margin:0, fontWeight:800, fontSize:22, letterSpacing:'-.02em' }}>
            Miércoles 11 de junio
          </p>
          <p style={{ margin:'4px 0 0', fontWeight:700, fontSize:16, color:'var(--coral)' }}>
            hasta las 17:00 h
          </p>
        </div>
      </div>

      {/* botón cerrar */}
      <div style={{ padding:'20px 20px 0' }}>
        <button className="btn btn-accent" onClick={onClose}>
          <Icon name="check" size={20} /> Entendido · cerrar
        </button>
      </div>

      <div style={{ height:40 }} />
    </div>
  );
}

/* ---- Helpers de layout para el reglamento ---- */
function RuleSection({ icon, color, label, children }) {
  return (
    <div style={{ padding:'14px 20px 0' }}>
      <div className="rule-section">
        <div className="rule-section-head">
          <div className="ic" style={{ background: color + '22' }}>
            <Icon name={icon} size={17} style={{ color }} />
          </div>
          <span style={{ fontWeight:800, fontSize:14 }}>{label}</span>
        </div>
        {children}
      </div>
    </div>
  );
}

function RuleItem({ left, children }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:12,
      padding:'12px 16px', borderTop:'1px solid var(--line)',
    }}>
      {left && <div style={{ flexShrink:0, paddingTop:1 }}>{left}</div>}
      <div style={{ flex:1, fontSize:13.5, fontWeight:600, lineHeight:1.5 }}>{children}</div>
    </div>
  );
}

function RulePts({ color, children }) {
  const colors = {
    lime:   { bg:'rgba(51,111,27,.12)',   fg:'var(--lime)'   },
    gold:   { bg:'rgba(253,211,1,.18)',   fg:'#7A6000'       },
    navy:   { bg:'rgba(0,52,105,.10)',    fg:'var(--navy)'   },
    orange: { bg:'rgba(247,149,22,.15)',  fg:'var(--orange)' },
    violet: { bg:'rgba(140,107,255,.14)', fg:'var(--violet)' },
    coral:  { bg:'rgba(216,19,26,.12)',   fg:'var(--coral)'  },
    /* legacy aliases */
    cyan:   { bg:'rgba(0,52,105,.10)',    fg:'var(--navy)'   },
  };
  const c = colors[color] || colors.lime;
  return (
    <div style={{
      minWidth:48, height:32, borderRadius:8,
      background: c.bg, color: c.fg,
      fontFamily:"'Brasil2014Numeros','Brasil2014Numeros',sans-serif",
      fontWeight:700, fontSize:15,
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:'0 10px', whiteSpace:'nowrap',
    }}>{children}</div>
  );
}

Object.assign(window, { ScreenRules });
