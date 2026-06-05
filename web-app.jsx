/* ============================================================
   WEB APP — Sidebar layout, desktop-first
   ============================================================ */

/* ---- Sidebar ---- */
function WebSidebar({ tab, setTab, league, openLeagues, openRules }) {
  const DB = window.DB;
  const me = DB.leaderboard.find(r => r.me) || DB.leaderboard[0] || { rank:1, pts:0 };

  const navItems = [
    { id: 'inicio',       icon: 'home',    label: 'Inicio'     },
    { id: 'predicciones', icon: 'ball',    label: 'Selección'  },
    { id: 'bracket',      icon: 'trophy',  label: 'Bracket'    },
    { id: 'ranking',      icon: 'chart',   label: 'Ranking'    },
    { id: 'perfil',       icon: 'user',    label: 'Perfil'     },
  ];

  const picks = DB.myPicks;
  const teamsDone = [1,2,3,4,5,6].reduce((s,id) => {
    const arr = id===5 ? (picks.g5?[picks.g5]:[]) : (picks['g'+id]||[]);
    return s + arr.length;
  }, 0);

  return (
    <aside className="web-sidebar">
      {/* Brand */}
      <div className="web-brand">
        <div className="web-brand-icon">
          <Icon name="trophy" size={20} />
        </div>
        <div className="web-brand-text">
          <div className="name">Porra Mundial</div>
          <div className="sub">USA · CAN · MEX 2026</div>
        </div>
      </div>
      {/* Franja Brasil bajo el brand — referencia a la camiseta canarinha */}
      <div style={{ margin: '-10px 14px 12px', overflow: 'hidden', borderRadius: 6 }}>
        <BrasilBand slim />
      </div>

      {/* League card */}
      <div className="web-sidebar-league" onClick={openLeagues}>
        <div className="lg-name">
          <span className="lg-dot" style={{ background: league.color }} />
          {league.name}
        </div>
        <div className="lg-stats">
          <div className="lg-stat">
            <span className="lg-val">{league.pot}</span>
            <span className="lg-lbl">Bote</span>
          </div>
          <div className="lg-stat">
            <span className="lg-val">{me.rank}º</span>
            <span className="lg-lbl">Puesto</span>
          </div>
          <div className="lg-stat">
            <span className="lg-val">{me.pts}</span>
            <span className="lg-lbl">Pts</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="web-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={'web-nav-item' + (tab === item.id ? ' active' : '')}
            onClick={() => setTab(item.id)}
          >
            <span className="nav-ic">
              <Icon name={item.icon} size={17} sw={tab === item.id ? 2.4 : 2} />
            </span>
            {item.label}
            {item.id === 'predicciones' && teamsDone < 11 && (
              <span className="nav-badge">{teamsDone}/11</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="web-sidebar-footer">
        <button className="web-sidebar-rules-btn" onClick={openRules}>
          <Icon name="lock" size={16} />
          Reglamento oficial
        </button>
        <div className="web-price-tag">
          <span>Inscripción</span>
          <span style={{ color: 'var(--lime)', fontFamily: "'Brasil2014Numeros',monospace", fontWeight: 700 }}>10 €</span>
        </div>
      </div>
    </aside>
  );
}

/* ---- Right Rail ---- */
function WebRail({ openRules }) {
  const DB = window.DB;
  const cd = window.useCountdown ? window.useCountdown(DB.deadline.getTime()) : { d:13, h:4, m:22, s:0, passed:false };
  const me = DB.leaderboard.find(r => r.me) || DB.leaderboard[0] || { rank:1, pts:0, av:'?', col:'#666' };
  const top5 = DB.leaderboard.slice(0, 5);

  const picks = DB.myPicks;
  const allPicks = [1,2,3,4,5,6].flatMap(id =>
    id===5 ? (picks.g5?[picks.g5]:[]) : (picks['g'+id]||[])
  );
  const groupOf = (teamId) => DB.porraGroups.find(g => g.teams.includes(teamId));

  return (
    <aside className="web-rail">

      {/* Deadline widget */}
      {!cd.passed && (
        <div className="rail-section">
          <div className="rail-label">Cierre de inscripción</div>
          <div className="rail-deadline">
            <TriFlag size={44} color="#FDD301" position="tr" opacity={0.70} />
            <ArcBand size={80} color="#336F1B" thickness={10} opacity={0.10} position="bl" />
            <div className="dl-label">Fecha límite</div>
            <div className="dl-date">Mié 11 jun · 17:00 h</div>
            <div className="dl-counter">
              <div className="dl-unit">
                <span className="dl-num">{String(cd.d).padStart(2,'0')}</span>
                <span className="dl-unit-lbl">días</span>
              </div>
              <div className="dl-unit">
                <span className="dl-num">{String(cd.h).padStart(2,'0')}</span>
                <span className="dl-unit-lbl">horas</span>
              </div>
              <div className="dl-unit">
                <span className="dl-num">{String(cd.m).padStart(2,'0')}</span>
                <span className="dl-unit-lbl">min</span>
              </div>
              <div className="dl-unit">
                <span className="dl-num" style={{ color:'var(--muted)' }}>{String(cd.s).padStart(2,'0')}</span>
                <span className="dl-unit-lbl">seg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My teams */}
      {allPicks.length > 0 && (
        <div className="rail-section">
          <div className="rail-label">Mis equipos ({allPicks.length}/11)</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {allPicks.map(teamId => {
              const t = DB.T[teamId];
              const g = groupOf(teamId);
              return (
                <div key={teamId} className="rail-team-chip">
                  <Flag team={t} size={22} />
                  <span style={{ flex:1, fontWeight:700, fontSize:13 }}>{t.name}</span>
                  <span className={'group-badge' + (g?.id===1?' g1':'')} style={{ fontSize:10 }}>{g?.id}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top 5 */}
      <div className="rail-section">
        <div className="rail-label">Clasificación</div>
        <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
          {top5.map(r => {
            const medalCol = ['#F79516','#9AA2BA','#cd7f32'];
            return (
              <div key={r.rank} className={'rail-lb-row' + (r.me ? ' me' : '')}>
                <span style={{
                  width:22, textAlign:'center',
                  fontFamily:"'Brasil2014Numeros',monospace", fontWeight:700, fontSize:13,
                  color: r.rank<=3 ? medalCol[r.rank-1] : 'var(--muted-2)',
                }}>{r.rank}</span>
                <Av txt={r.av} col={r.col} size={28} r={9} />
                <span style={{ flex:1, fontWeight:700, fontSize:13 }}>{r.name.split(' ')[0]}</span>
                <span className="bignum" style={{ fontSize:14, color: r.me ? 'var(--lime)' : 'var(--text)' }}>{r.pts}</span>
              </div>
            );
          })}
          {me.rank > 5 && (
            <>
              <div style={{ height:4, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span className="mut" style={{ fontSize:11 }}>···</span>
              </div>
              <div className="rail-lb-row me">
                <span style={{ width:22, textAlign:'center', fontFamily:"'Brasil2014Numeros',monospace", fontWeight:700, fontSize:13, color:'var(--muted)' }}>{me.rank}</span>
                <Av txt={me.av} col={me.col} size={28} r={9} />
                <span style={{ flex:1, fontWeight:700, fontSize:13 }}>Tú</span>
                <span className="bignum" style={{ fontSize:14, color:'var(--lime)' }}>{me.pts}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Activity */}
      <div className="rail-section">
        <div className="rail-label">Actividad</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DB.activity.map((a,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9 }}>
              <Av txt={a.av} col={a.col} size={30} r={9} />
              <div style={{ flex:1 }}>
                <span style={{ fontSize:12, fontWeight:700, lineHeight:1.4, display:'block' }}>
                  <b>{a.who.split(' ')[0]}</b> {a.act}
                </span>
                <span className="mut" style={{ fontSize:11, fontWeight:600 }}>{a.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules link */}
      <div style={{ marginTop:'auto', paddingTop:8, borderTop:'1px solid var(--line)' }}>
        <button onClick={openRules} style={{
          display:'flex', alignItems:'center', gap:8,
          background:'none', border:'none', cursor:'pointer',
          color:'var(--muted)', fontFamily:'inherit', fontWeight:700, fontSize:12,
          padding:'8px 0', width:'100%',
        }}>
          <Icon name="lock" size={14} />
          Reglamento oficial · 10€/jugador
        </button>
      </div>
    </aside>
  );
}

/* ---- Web Mobile Bottom Bar (≤640px) ---- */
function WebMobileBar({ tab, setTab }) {
  const navItems = [
    { id: 'inicio',       icon: 'home',    label: 'Inicio'    },
    { id: 'predicciones', icon: 'ball',    label: 'Selección' },
    { id: 'bracket',      icon: 'trophy',  label: 'Bracket'   },
    { id: 'ranking',      icon: 'chart',   label: 'Ranking'   },
    { id: 'perfil',       icon: 'user',    label: 'Perfil'    },
  ];
  return (
    <div className="web-mobile-bar">
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => setTab(item.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: tab === item.id ? 'var(--lime)' : 'var(--muted)',
            padding: '4px 0',
          }}
        >
          <Icon name={item.icon} size={20} sw={tab === item.id ? 2.4 : 2} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.03em' }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---- Web Screen Wrapper ---- */
function WebScreenWrapper({ title, breadcrumb, children, action }) {
  return (
    <div className="web-screen-enter">
      <div className="web-screen-header">
        {breadcrumb && <div className="breadcrumb">{breadcrumb}</div>}
        <div className="head-row">
          <h1>{title}</h1>
          {action}
        </div>
        {/* Acento editorial bajo el titular — periódico deportivo */}
        <div style={{ marginTop: 10 }}>
          <BarStack
            colors={['#336F1B','#FDD301','#D8131A']}
            widths={[100, 64, 40]}
            barH={3} gap={4} opacity={0.30}
          />
        </div>
      </div>
      {children}
    </div>
  );
}

/* ---- Web Home Screen ---- */
function WebScreenHome({ go, openRules, openLeagues, league }) {
  const DB = window.DB;
  const me = DB.leaderboard.find(r => r.me);
  const picks = DB.myPicks;
  const getGroupArr = (id) => id===5 ? (picks.g5?[picks.g5]:[]) : (picks['g'+id]||[]);
  const teamsDone = [1,2,3,4,5,6].reduce((s,id) => s+getGroupArr(id).length, 0);
  const pending = 11 - teamsDone;
  const allPicks = [1,2,3,4,5,6].flatMap(id => getGroupArr(id));
  const live = DB.matches.find(m => m.status==='live');
  const deadlinePassed = Date.now() > DB.deadline.getTime();

  return (
    <WebScreenWrapper
      breadcrumb="Porra Mundial 2026"
      title="Mi porra"
      action={
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Av txt="ÁL" col="linear-gradient(135deg,var(--violet),var(--cyan))" size={40} r={13} />
        </div>
      }
    >
      {/* Deadline banner */}
      {!deadlinePassed && pending > 0 && (
        <div className="web-deadline-hero" style={{ position:'relative', overflow:'hidden' }}>
          <TriFlag size={64} color="#F79516" position="tr" opacity={0.55} />
          <ArcBand size={120} color="#F79516" thickness={12} opacity={0.10} position="bl" />
          <div className="dh-icon"><Icon name="clock" size={22} /></div>
          <div className="dh-text">
            <div className="dh-title">{pending} selecciones pendientes</div>
            <div className="dh-sub">Cierre: miércoles 11 jun · 17:00 h</div>
            <div className="meter" style={{ marginTop:8, maxWidth:300 }}>
              <i style={{ width: Math.round((teamsDone/11)*100)+'%', background:'var(--orange)' }} />
            </div>
          </div>
          <div className="dh-cta">
            <button className="btn btn-sm" style={{ background:'var(--orange)', color:'#1a0900', width:'auto' }}
              onClick={() => go('predicciones')}>
              Completar <Icon name="chevron" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Live match (banner si hay) */}
      {live && (
        <div style={{ marginBottom:28 }}>
          <div className="card" style={{ borderColor:'rgba(216,19,26,.3)', padding:'16px 20px', position:'relative', overflow:'hidden' }}>
            <TriFlag size={52} color="#D8131A" position="tr" opacity={0.35} />
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span className="tag tag-live"><span className="blink" />EN VIVO {live.min}</span>
              <span className="mut" style={{ fontSize:12, fontWeight:700 }}>{live.venue}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:0 }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:12 }}>
                <Flag team={live.home} size={38} />
                <span style={{ fontWeight:800, fontSize:18 }}>{DB.T[live.home].name}</span>
              </div>
              <div style={{ padding:'0 20px', textAlign:'center' }}>
                <span className="bignum" style={{ fontSize:32, lineHeight:1 }}>{live.live}</span>
              </div>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:12, justifyContent:'flex-end', flexDirection:'row-reverse' }}>
                <Flag team={live.away} size={38} />
                <span style={{ fontWeight:800, fontSize:18 }}>{DB.T[live.away].name}</span>
              </div>
            </div>
            {[live.home,live.away].some(id => allPicks.includes(id)) && (
              <div style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, color:'var(--lime)', fontSize:13, fontWeight:700 }}>
                <Icon name="sparkle" size={15} />
                Tienes {[live.home,live.away].filter(id=>allPicks.includes(id)).map(id=>DB.T[id].name).join(' y ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2-col grid: mis equipos + próximos */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:28 }}>
        {/* Mis grupos */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div className="sec-head" style={{ padding:0, margin:'0 0 14px' }}>
            <h2>Mis equipos</h2>
            <a onClick={() => go('predicciones')}>Editar</a>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[1,2,3,4,5,6].map(gid => {
              const arr = getGroupArr(gid);
              if (arr.length===0) return null;
              const g = DB.porraGroups.find(x=>x.id===gid);
              return (
                <div key={gid}>
                  <div className="row gap6" style={{ marginBottom:5 }}>
                    <span className={'group-badge'+(gid===1?' g1':'')}>{gid}</span>
                    <span className="mut" style={{ fontSize:11, fontWeight:700 }}>{g.name}</span>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {arr.map(tid => {
                      const t = DB.T[tid];
                      return (
                        <div key={tid} className="row gap6" style={{
                          background:'var(--surface-2)', borderRadius:9, padding:'5px 9px',
                          border:'1px solid var(--line)',
                        }}>
                          <Flag team={t} size={18} />
                          <span style={{ fontWeight:700, fontSize:12 }}>{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {allPicks.length === 0 && (
              <p className="mut" style={{ fontSize:13, fontWeight:600, margin:0 }}>
                Sin selecciones todavía.{' '}
                <span onClick={() => go('predicciones')} style={{ color:'var(--orange)', cursor:'pointer' }}>
                  Elige tus equipos →
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Próximos partidos */}
        <div className="card" style={{ padding:'16px 18px' }}>
          <div className="sec-head" style={{ padding:0, margin:'0 0 14px' }}>
            <h2>Próximos partidos</h2>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {DB.matches.filter(m=>m.status==='soon').map(m => (
              <div key={m.id} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
                background:'var(--surface-2)', borderRadius:11, border:'1px solid var(--line)',
              }}>
                <div style={{ display:'flex', flexDirection:'column', gap:4, flex:1 }}>
                  <div className="row gap6">
                    <Flag team={m.home} size={20} />
                    <span style={{ fontWeight:700, fontSize:12 }}>{DB.T[m.home].code}</span>
                    {allPicks.includes(m.home) && <span style={{ width:5,height:5,borderRadius:'50%',background:'var(--lime)',flexShrink:0 }} />}
                  </div>
                  <div className="row gap6">
                    <Flag team={m.away} size={20} />
                    <span style={{ fontWeight:700, fontSize:12 }}>{DB.T[m.away].code}</span>
                    {allPicks.includes(m.away) && <span style={{ width:5,height:5,borderRadius:'50%',background:'var(--lime)',flexShrink:0 }} />}
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="num" style={{ fontSize:11, color:'var(--cyan)', fontWeight:700 }}>{m.date}</div>
                  <div className="num" style={{ fontSize:12, fontWeight:700, color:'var(--muted)' }}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Puntos por selección */}
      {allPicks.length > 0 && (() => {
        const tPts = DB.teamPts || {};
        const pickRows = [1,2,3,4,5,6].flatMap(gid => {
          const arr = getGroupArr(gid);
          return arr.map(teamId => ({ teamId, gid }));
        });
        const teamTotal = pickRows.reduce((s, { teamId }) => s + (tPts[teamId]?.total || 0), 0);
        const duoPicks = (picks.duo || []).filter(Boolean).map(pid => DB.players.find(p => p.id === pid)).filter(Boolean);
        const duoTotal = duoPicks.reduce((s, pl) => s + pl.goals + pl.assists, 0);
        return (
          <div style={{ marginBottom:28 }}>
            <div className="sec-head" style={{ padding:0, margin:'0 0 14px' }}>
              <h2>Puntos por selección</h2>
              <div className="row gap6">
                <span className="bignum" style={{ fontSize:15, color:'var(--lime)' }}>{teamTotal + duoTotal} pts totales</span>
              </div>
            </div>
            <div className="web-lb-table">
              {pickRows.map(({ teamId, gid }) => {
                const t = DB.T[teamId];
                const pts = tPts[teamId] || { group:0, knockout:0, total:0 };
                return (
                  <div key={teamId} className="web-lb-row">
                    <span className={'group-badge'+(gid===1?' g1':'')} style={{ fontSize:10, width:22, textAlign:'center' }}>{gid}</span>
                    <Flag team={t} size={28} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13 }}>{t.name}</div>
                      <div className="mut" style={{ fontSize:11, fontWeight:600 }}>
                        Grupos: {pts.group} pts · Eliminatorias: {pts.knockout} pts
                      </div>
                    </div>
                    <span className="bignum" style={{ fontSize:16, color:'var(--lime)' }}>{pts.total}</span>
                  </div>
                );
              })}
              {duoPicks.map(pl => {
                const t = DB.T[pl.team];
                const pts = pl.goals + pl.assists;
                return (
                  <div key={pl.id} className="web-lb-row">
                    <span style={{ fontSize:14, width:22, textAlign:'center' }}>✨</span>
                    <Flag team={t} size={28} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:13 }}>{pl.name} <span className="mut" style={{ fontWeight:600 }}>· Dúo Dinámico</span></div>
                      <div className="mut" style={{ fontSize:11, fontWeight:600 }}>
                        {pl.goals} goles + {pl.assists} asistencias
                      </div>
                    </div>
                    <span className="bignum" style={{ fontSize:16, color:'var(--orange)' }}>+{pts}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Separador editorial entre contenido y ranking */}
      <WaveBand color="var(--gold)" height={16} opacity={0.45} thick={2.5} />

      {/* Leaderboard completo */}
      <div style={{ marginBottom:28 }}>
        <div className="sec-head" style={{ padding:0, margin:'0 0 14px' }}>
          <h2>Clasificación completa</h2>
          <a onClick={() => go('ranking')}>Ver ranking →</a>
        </div>
        <div className="web-lb-table">
          {DB.leaderboard.map(r => {
            const medalCol = ['#F79516','#9AA2BA','#cd7f32'];
            return (
              <div key={r.rank} className={'web-lb-row' + (r.me?' me':'')}>
                <span style={{
                  width:28, textAlign:'center',
                  fontFamily:"'Brasil2014Numeros',monospace", fontWeight:700, fontSize:14,
                  color: r.rank<=3 ? medalCol[r.rank-1] : 'var(--muted-2)',
                }}>{r.rank}</span>
                <Av txt={r.av} col={r.col} size={36} r={11} />
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>{r.name}</div>
                  <div className="mut" style={{ fontSize:11.5, fontWeight:600 }}>{r.exact} plenos · {r.user}</div>
                </div>
                <div className="row gap8">
                  <TrendChip t={r.trend} />
                  <span className="bignum" style={{ fontSize:17, color: r.me?'var(--lime)':'var(--text)' }}>{r.pts}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity */}
      <DiagBlock color="var(--lime)" height={20} opacity={0.10} reverse />
      <div>
        <div className="sec-head" style={{ padding:0, margin:'0 0 14px' }}>
          <h2>Actividad de la liga</h2>
        </div>
        <div className="card" style={{ padding:'16px 18px', display:'flex', flexDirection:'column', gap:16 }}>
          {DB.activity.map((a,i) => (
            <div key={i} className="row gap14">
              <Av txt={a.av} col={a.col} size={40} />
              <div className="col" style={{ flex:1 }}>
                <span style={{ fontSize:14, fontWeight:600 }}>
                  <b style={{ fontWeight:800 }}>{a.who}</b> {a.act}
                </span>
                <span className="mut" style={{ fontSize:12 }}>{a.detail} · {a.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WebScreenWrapper>
  );
}

/* ---- Trend chip ---- */
function TrendChip({ t }) {
  if (!t || t==='0' || t===0) return <span className="mut" style={{ fontSize:12, fontWeight:700, width:26, textAlign:'center' }}>–</span>;
  const up = String(t).startsWith('+');
  return (
    <span style={{ display:'flex', alignItems:'center', gap:2,
      color: up ? 'var(--green)' : 'var(--coral)', fontSize:11.5, fontWeight:800 }}>
      <Icon name="arrowup" size={12} style={{ transform: up?'none':'rotate(180deg)' }} />
      {String(t).replace(/[+-]/,'')}
    </span>
  );
}

/* ---- Web Selection Screen (wraps ScreenPredict) ---- */
function WebScreenSelect({ openRules }) {
  return (
    <WebScreenWrapper breadcrumb="Inscripción" title="Tus selecciones">
      {/* strip the mobile appbar from ScreenPredict */}
      <ScreenPredict openRules={openRules} />
    </WebScreenWrapper>
  );
}

/* ---- Web Bracket Screen ---- */
function WebScreenBracket() {
  return (
    <WebScreenWrapper breadcrumb="Eliminatorias" title="Tu bracket">
      <ScreenBracket />
    </WebScreenWrapper>
  );
}

/* ---- Web Ranking Screen ---- */
function WebScreenRanking({ league, openLeagues }) {
  return (
    <WebScreenWrapper breadcrumb="Competición" title="Clasificación">
      <ScreenRanking league={league} openLeagues={openLeagues} />
    </WebScreenWrapper>
  );
}

/* ---- Web Perfil Screen ---- */
function WebScreenPerfil({ openLeagues, openRules }) {
  return (
    <WebScreenWrapper breadcrumb="Cuenta" title="Perfil">
      <ScreenProfile openLeagues={openLeagues} openRules={openRules} openDraft={() => setShowDraft(true)} />
    </WebScreenWrapper>
  );
}

/* ============================================================
   WEB APP ROOT
   ============================================================ */
const WEB_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#FDD301",
  "ambient": true
}/*EDITMODE-END*/;

const WEB_ACCENTS = [
  { hex: '#FDD301', rgb: '253,211,1',   ink: '#3a2800' },
  { hex: '#ABCB2D', rgb: '171,203,45',  ink: '#1a2800' },
  { hex: '#F79516', rgb: '247,149,22',  ink: '#3a1500' },
  { hex: '#27E5D4', rgb: '39,229,212',  ink: '#06201D' },
  { hex: '#8C6BFF', rgb: '140,107,255', ink: '#0c0820' },
];

function WebApp() {
  const DB = window.DB;
  const [t, setTweak] = useTweaks(WEB_TWEAK_DEFAULTS);
  const [tab, setTab] = useState('inicio');
  const [league, setLeague] = useState(DB.leagues[0]);
  const [showLeagues, setShowLeagues] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [prevTab, setPrevTab] = useState(null);

  /* ---- Auth (mismo patrón que App mobile) ---- */
  const [user,        setUser]        = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onboarded,   setOnboarded]   = useState(false);

  const loadUserPorra = async () => {
    if (!window.SB) return;
    try {
      const porras = await window.SB.myPorras();
      if (porras.length > 0) {
        const p = porras[0];
        window.currentPorraId = p.id;
        setLeague(typeof window.porraToLeague === 'function'
          ? window.porraToLeague(p)
          : { id: p.id, name: p.name, members: p.memberCount ?? '?',
              pot: `${p.price || 10} €`, me: '?º', color: '#D8131A', code: p.code || '' });
        const saved = await window.SB.loadPicks(p.id);
        if (saved?.data) DB.myPicks = saved.data;
        DB.myPicksLocked = saved?.locked === true;
        if (p.config?.porraGroups) DB.porraGroups = p.config.porraGroups;
      }
    } catch(e) {
      console.warn('[Web] Error cargando porra:', e);
    }
    setOnboarded(true);
  };

  useEffect(() => {
    if (!window.sb || !window.SB) { setAuthLoading(false); return; }
    window.sb.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      if (session?.user) loadUserPorra();
      else setAuthLoading(false);
    });
    const { data: { subscription } } = window.sb.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) loadUserPorra();
      else { setOnboarded(false); window.currentPorraId = null; }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const a = WEB_ACCENTS.find(x => x.hex === t.accent) || WEB_ACCENTS[0];
    const r = document.documentElement.style;
    r.setProperty('--lime', a.hex);
    r.setProperty('--lime-rgb', a.rgb);
    r.setProperty('--accent', a.hex);
    r.setProperty('--accent-ink', a.ink);
  }, [t.accent]);

  /* ---- Loading ---- */
  if (authLoading) {
    return (
      <div className="web-root" style={{ alignItems:'center', justifyContent:'center', display:'flex' }}>
        <div style={{ textAlign:'center', color:'var(--muted)' }}>
          <div style={{ fontFamily:'var(--font-poster)', fontSize:48, letterSpacing:'.05em', color:'var(--lime)', marginBottom:8 }}>
            PORRA MUNDIAL
          </div>
          <p style={{ fontWeight:700, fontSize:13, margin:0 }}>Comprobando sesión...</p>
        </div>
      </div>
    );
  }

  /* ---- Auth gate ---- */
  const supabaseConfigured = window.SUPABASE_CONFIGURED === true;
  if (supabaseConfigured && !user) {
    return (
      <div className="web-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', gridTemplateColumns:'1fr' }}>
        <div style={{ maxWidth:400, width:'100%', padding:'0 24px' }}>
          <div style={{ fontFamily:'var(--font-poster)', fontSize:56, letterSpacing:'.05em', color:'var(--lime)', lineHeight:1, marginBottom:24 }}>
            PORRA<br/>MUNDIAL
          </div>
          <AuthScreen />
        </div>
      </div>
    );
  }

  /* ---- Onboarding gate ---- */
  if (!onboarded) {
    return (
      <div className="web-root" style={{ display:'flex', alignItems:'center', justifyContent:'center', gridTemplateColumns:'1fr' }}>
        <div style={{ maxWidth:480, width:'100%', padding:'0 24px' }}>
          <Onboarding
            onDone={() => setOnboarded(true)}
            onPorraReady={() => setOnboarded(true)}
            openRules={() => setShowRules(true)}
          />
        </div>
      </div>
    );
  }

  const changeTab = (newTab) => {
    setPrevTab(tab);
    setTab(newTab);
  };

  const screens = {
    inicio:       <WebScreenHome go={changeTab} openRules={() => setShowRules(true)} openLeagues={() => setShowLeagues(true)} league={league} />,
    predicciones: <WebScreenSelect openRules={() => setShowRules(true)} />,
    bracket:      <WebScreenBracket />,
    ranking:      <WebScreenRanking league={league} openLeagues={() => setShowLeagues(true)} />,
    perfil:       <WebScreenPerfil openLeagues={() => setShowLeagues(true)} openRules={() => setShowRules(true)} />,
  };

  return (
    <React.Fragment>
      <div className="web-root">
        <WebSidebar
          tab={tab}
          setTab={changeTab}
          league={league}
          openLeagues={() => setShowLeagues(true)}
          openRules={() => setShowRules(true)}
        />

        <main className="web-main">
          <div className="web-main-inner" key={tab}>
            {screens[tab]}
          </div>
        </main>

        <WebRail openRules={() => setShowRules(true)} />
      </div>

      <WebMobileBar tab={tab} setTab={changeTab} />

      {/* Sheets / overlays */}
      {showLeagues && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <LeaguesSheet
            current={league}
            onPick={(l) => { setLeague(l); setShowLeagues(false); }}
            onClose={() => setShowLeagues(false)}
          />
        </div>
      )}
      {showRules && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <ScreenRules onClose={() => setShowRules(false)} />
        </div>
      )}
      {showDraft && (
        <div style={{ position:'fixed', inset:0, zIndex:200 }}>
          <ScreenDraft onDone={() => setShowDraft(false)} onBack={() => setShowDraft(false)} />
        </div>
      )}

      <TweaksPanel>
        <TweakSection label="Identidad visual" />
        <TweakColor label="Acento" value={t.accent}
          options={WEB_ACCENTS.map(a => a.hex)}
          onChange={(v) => setTweak('accent', v)} />
      {/* Fondo con halos — eliminado en v2 */}
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('web-root')).render(<WebApp />);
