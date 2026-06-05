/* ============================================================
   Pantalla INICIO
   ============================================================ */
function ScreenHome({ go, openLeagues, league, openRules, userName, userInitials, currentPorra, liveMatches }) {
  const DB = window.DB;
  const [realLb, setRealLb] = useState(null);
  const displayName = userName || 'Jugador';
  const initials    = userInitials || displayName.slice(0, 2).toUpperCase();

  /* Cargar mini-ranking real */
  useEffect(() => {
    if (!window.SB || !currentPorra?.id) return;
    window.SB.leaderboard(currentPorra.id).then(rows => {
      if (!rows || rows.length === 0) return;
      const mapped = rows.map((r, i) => ({
        rank:  r.rank || i + 1,
        name:  r.display_name || 'Jugador',
        user:  '',
        pts:   r.pts ?? 0,
        av:    (r.display_name || '?').slice(0,2).toUpperCase(),
        col:   ['#D8131A','#27E5D4','#8C6BFF','#FDD301','#F79516','#ABCB2D','#4DA6FF'][i % 7],
        trend: '0',
        exact: 0,
        me:    r.me || false,
      }));
      setRealLb(mapped);
    }).catch(() => {});
  }, [currentPorra?.id, liveMatches]);

  /* Usar datos reales si están disponibles, si no mock */
  const lbData = realLb || DB.leaderboard;
  const me = lbData.find(r => r.me) || lbData[0] || { rank:1, pts:0 };
  const picks = DB.myPicks;
  const getGroupArr = (id) =>
    id === 5 ? (picks.g5 ? [picks.g5] : []) : (picks['g'+id] || []);
  const teamsDone = [1,2,3,4,5,6].reduce((s,id) => s+getGroupArr(id).length, 0);
  const totalPicks = [1,2,3,4,5,6].flatMap(id => getGroupArr(id));
  const pct = Math.round((teamsDone / 11) * 100);
  const pending = 11 - teamsDone;
  const deadlinePassed = Date.now() > DB.deadline.getTime();

  const top3 = lbData.slice(0, 3);
  const live = DB.matches.find(m => m.status === 'live');

  return (
    <div className="scroll no-sb">
      <div className="safe-top" />

      {/* appbar */}
      <div className="appbar">
        <div className="avatar">{initials}</div>
        <div className="col" style={{ gap: 1 }}>
          <span className="greet">¡Hola, {displayName.split(' ')[0]}!</span>
          <span className="title">Mi porra</span>
        </div>
        <div className="spacer" />
        <button className="icon-btn" onClick={openRules}>
          <Icon name="check" size={19} style={{ transform:'none' }} />
          <span style={{ position:'absolute', fontSize:7, fontWeight:900, bottom:5,
            fontFamily:"'Brasil2014Numeros',monospace", letterSpacing:'-.05em', color:'var(--muted)' }}>REG</span>
        </button>
        <button className="icon-btn" style={{ marginLeft:6 }}>
          <Icon name="bell" size={21} /><span className="dot" />
        </button>
      </div>

      <BrasilBand />

      {/* hero — liga selector con color block verde */}
      <div style={{ padding: '0 20px' }}>
        <button onClick={openLeagues} style={{ width:'100%', textAlign:'left', background:'none', border:'none', padding:0, cursor:'pointer', color:'inherit' }}>
          <div style={{ borderRadius:20, overflow:'hidden', border:'1px solid var(--line-2)',
            boxShadow:'0 2px 12px rgba(0,52,105,.07)' }}>
            {/* Cabecera verde con nombre de la porra + figuras geométricas */}
            <div style={{ background:'var(--lime)', padding:'14px 18px', position:'relative', overflow:'hidden' }}>
              <GeomCorner size={90} color="#FDD301" position="tr" />
              <div style={{ position:'absolute', right:10, top:-10, pointerEvents:'none' }}>
                <SunBurst size={90} color="#FDD301" rays={12} opacity={0.25} />
              </div>
              <TriFlag size={56} color="#FDD301" position="tr" opacity={0.85} />
              <div className="row" style={{ justifyContent:'space-between', alignItems:'center', position:'relative' }}>
                <div className="row gap10">
                  <div style={{ width:34, height:34, borderRadius:10, background:'rgba(255,255,255,.2)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="users" size={18} style={{ color:'#fff' }} />
                  </div>
                  <div className="col" style={{ gap:1 }}>
                    <span style={{ fontWeight:800, fontSize:15, color:'#fff' }}>{league.name}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,.75)' }}>{league.members} jugadores · toca para cambiar</span>
                  </div>
                </div>
                <Icon name="chevron" size={17} style={{ color:'rgba(255,255,255,.7)', flexShrink:0 }} />
              </div>
            </div>
            {/* Stats en crema */}
            <div style={{ background:'var(--surface)', padding:'14px 18px' }}>
              <div className="row" style={{ gap:0 }}>
                {[
                  { lbl:'Tu puesto', val:me.rank+'º', col:'var(--text)', size:30 },
                  { lbl:'Puntos', val:me.pts, col:'var(--navy)', size:30 },
                ].map(({ lbl, val, col, size }, i) => (
                  <React.Fragment key={lbl}>
                    {i > 0 && <div style={{ width:1, alignSelf:'stretch', background:'var(--line-2)', margin:'0 14px' }} />}
                    <div className="col" style={{ flex:1, gap:1 }}>
                      <span style={{ fontSize:10, fontWeight:800, letterSpacing:'.1em',
                        textTransform:'uppercase', color:'var(--muted)' }}>{lbl}</span>
                      <span className="bignum" style={{ fontSize:size, color:col, lineHeight:1.1, whiteSpace:'nowrap' }}>{val}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* banner inscripción */}
      {!deadlinePassed && (
        <div style={{ padding: '12px 20px 0' }}>
          {pending > 0 ? (
            <div className="card" style={{ borderColor:'rgba(247,149,22,.3)', background:'rgba(247,149,22,.08)' }}>
              <div className="pad row" style={{ gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'rgba(247,149,22,.16)',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'var(--orange)', flex:'none' }}>
                  <Icon name="clock" size={22} />
                </div>
                <div className="col" style={{ flex:1, gap:4 }}>
                  <span style={{ fontWeight:800, fontSize:14.5 }}>{pending} selecciones pendientes</span>
                  <span className="mut" style={{ fontSize:12, fontWeight:600 }}>Cierre: miércoles 11 jun · 17:00 h</span>
                  <div className="meter" style={{ marginTop:4 }}>
                    <i style={{ width:pct+'%', background:'var(--orange)', transition:'width .4s ease' }} />
                  </div>
                </div>
                <button
                  style={{ background:'var(--orange)', color:'#1a0900', fontWeight:800,
                    border:'none', borderRadius:10, padding:'0 14px', height:38, fontSize:13,
                    cursor:'pointer', flexShrink:0, fontFamily:'inherit' }}
                  onClick={() => go('predicciones')}>Jugar</button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ borderColor:'rgba(var(--lime-rgb),.3)', background:'rgba(var(--lime-rgb),.06)' }}>
              <div className="pad row" style={{ gap:14 }}>
                <div style={{ width:44, height:44, borderRadius:13, background:'rgba(var(--lime-rgb),.18)',
                  display:'flex', alignItems:'center', justifyContent:'center', color:'var(--lime)', flex:'none' }}>
                  <Icon name="check" size={24} />
                </div>
                <div className="col" style={{ flex:1, gap:2 }}>
                  <span style={{ fontWeight:800, fontSize:14.5 }}>¡11 selecciones completadas!</span>
                  <span className="mut" style={{ fontSize:12, fontWeight:600 }}>Cierre: 11 jun · 17:00 h</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* mis equipos seleccionados */}
      {totalPicks.length > 0 && (
        <>
          <SecHead title="Mis equipos" action="Editar" onAction={() => go('predicciones')} />
          <div style={{ padding:'0 20px' }}>
            <div className="card" style={{ padding:'12px 14px' }}>
              {[1,2,3,4,5,6].map(gid => {
                const arr = getGroupArr(gid);
                if (arr.length === 0) return null;
                const g = DB.porraGroups.find(x => x.id === gid);
                return (
                  <div key={gid} style={{ marginBottom:10 }}>
                    <div className="row gap6" style={{ marginBottom:7 }}>
                      <span className={'group-badge' + (gid===1?' g1':'')}>{gid}</span>
                      <span className="mut" style={{ fontSize:11.5, fontWeight:700 }}>{g.name}</span>
                    </div>
                    <div className="row" style={{ gap:8, flexWrap:'wrap' }}>
                      {arr.map(teamId => {
                        const t = DB.T[teamId];
                        return (
                          <div key={teamId} className="row gap6" style={{
                            background:'var(--surface-2)', borderRadius:10, padding:'6px 10px',
                            border:'1px solid var(--line-2)',
                          }}>
                            <Flag team={t} size={20} />
                            <span style={{ fontWeight:700, fontSize:12.5 }}>{t.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Puntos por selección */}
      {totalPicks.length > 0 && (() => {
        const tPts = DB.teamPts || {};
        const scoring = DB.scoring || {};
        const teamRows = [1,2,3,4,5,6].flatMap(gid => {
          const arr = getGroupArr(gid);
          const g = DB.porraGroups.find(x => x.id === gid);
          return arr.map(teamId => ({ teamId, gid, multiplier: g?.multiplier || 1 }));
        });
        /* Aplicar multiplicador del grupo al total de pts */
        const teamTotal = teamRows.reduce((s, { teamId, multiplier }) => {
          const raw = tPts[teamId]?.total || 0;
          return s + raw * multiplier;
        }, 0);
        const duo = picks.duo || [];
        const duoPlayers = duo.filter(Boolean).map(pid => DB.players.find(p => p.id === pid)).filter(Boolean);
        const duoTotal = duoPlayers.reduce((s, pl) => s + pl.goals + pl.assists, 0);
        const grandTotal = Math.round((teamTotal + duoTotal) * 10) / 10;
        const torneoIniciado = teamRows.some(({ teamId }) => (tPts[teamId]?.total || 0) > 0);

        return (
          <>
            <SecHead title="Puntos por selección" action="Ver ranking" onAction={() => go('ranking')} />
            <div style={{ padding: '0 20px' }}>
              <div className="card" style={{ padding: '12px 14px' }}>
                {!torneoIniciado ? (
                  <div className="row gap10" style={{ padding: '6px 0' }}>
                    <Icon name="clock" size={20} style={{ color:'var(--muted)', flexShrink:0 }} />
                    <div className="col" style={{ gap: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>Torneo no iniciado</span>
                      <span className="mut" style={{ fontSize: 11.5, fontWeight: 600 }}>
                        Los puntos aparecerán aquí en cuanto empiece el Mundial (12 jun)
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {teamRows.map(({ teamId, gid, multiplier }) => {
                      const t = DB.T[teamId];
                      const pts = tPts[teamId] || { group: 0, knockout: 0, total: 0 };
                      const totalWithMult = Math.round(pts.total * multiplier * 10) / 10;
                      return (
                        <div key={teamId} className="row gap10" style={{ marginBottom: 10, alignItems: 'center' }}>
                          <span className={'group-badge' + (gid === 1 ? ' g1' : '')} style={{ fontSize: 10 }}>{gid}</span>
                          <Flag team={t} size={22} />
                          <div className="col" style={{ flex: 1, gap: 1 }}>
                            <span style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</span>
                            <span className="mut" style={{ fontSize: 10.5, fontWeight: 600 }}>
                              Grupos: {pts.group} · KO: {pts.knockout}
                              {multiplier > 1 && <b style={{ color:'var(--orange)' }}> × {multiplier}</b>}
                            </span>
                          </div>
                          <span className="bignum" style={{ fontSize: 15, color: multiplier > 1 ? 'var(--orange)' : 'var(--lime)' }}>
                            {totalWithMult}
                          </span>
                        </div>
                      );
                    })}
                    {duoPlayers.length > 0 && (
                      <>
                        <div style={{ margin: '4px 0 10px', height: 1, background: 'var(--line)' }} />
                        {duoPlayers.map(pl => {
                          const t = DB.T[pl.team];
                          const pts = pl.goals + pl.assists;
                          return (
                            <div key={pl.id} className="row gap10" style={{ marginBottom: 8, alignItems: 'center' }}>
                              <Icon name="sparkle" size={16} style={{ color:'var(--orange)', flexShrink:0 }} />
                              <Flag team={t} size={22} />
                              <div className="col" style={{ flex: 1, gap: 1 }}>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{pl.name}</span>
                                <span className="mut" style={{ fontSize: 10.5, fontWeight: 600 }}>
                                  Dúo · {pl.goals}G + {pl.assists}A
                                </span>
                              </div>
                              <span className="bignum" style={{ fontSize: 15, color: 'var(--orange)' }}>+{pts}</span>
                            </div>
                          );
                        })}
                      </>
                    )}
                    <div style={{ marginTop: 8, paddingTop: 10, borderTop: '1px solid var(--line)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 13 }}>Total mis selecciones</span>
                      <span className="bignum" style={{ fontSize: 18, color: 'var(--lime)' }}>{grandTotal} pts</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        );
      })()}

      {/* en directo */}
      {live && (
        <>
          <WaveBand color="var(--coral)" height={12} opacity={0.45} thick={2} />
          <SecHead title="En directo" />
          <div style={{ padding:'0 20px' }}>
            <div className="card" style={{ borderColor:'rgba(216,19,26,.3)' }}>
              <div style={{ padding:'12px 16px' }}>
                <div className="row" style={{ justifyContent:'space-between', marginBottom:12 }}>
                  <span className="tag tag-live"><span className="blink" />EN VIVO {live.min}</span>
                  <span className="mut" style={{ fontSize:11, fontWeight:700 }}>{live.venue}</span>
                </div>
                <div className="row" style={{ alignItems:'center' }}>
                  <div className="side">
                    <Flag team={live.home} size={32} />
                    <span className="nm" style={{ fontSize:15 }}>{DB.T[live.home].name}</span>
                  </div>
                  <div className="mid">
                    <div className="bignum" style={{ fontSize:26, lineHeight:1 }}>{live.live}</div>
                  </div>
                  <div className="side r">
                    <Flag team={live.away} size={32} />
                    <span className="nm" style={{ fontSize:15 }}>{DB.T[live.away].name}</span>
                  </div>
                </div>
                {[live.home, live.away].some(id => totalPicks.includes(id)) && (
                  <div className="row gap6" style={{ marginTop:10, color:'var(--lime)', fontSize:12, fontWeight:700 }}>
                    <Icon name="sparkle" size={14} />
                    Tienes {[live.home,live.away].filter(id=>totalPicks.includes(id)).map(id=>DB.T[id].name).join(' y ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* próximos */}
      <SecHead title="Próximos partidos" action="Ver todos" onAction={() => go('predicciones')} />
      <div className="chips no-sb" style={{ gap:10, paddingBottom:4 }}>
        {DB.matches.filter(m => m.status==='soon').map(m => (
          <div key={m.id} className="card" style={{ minWidth:154, flex:'none' }}>
            <div style={{ padding:12 }}>
              <div className="row" style={{ justifyContent:'space-between', marginBottom:9 }}>
                <span className="tag tag-soon" style={{ fontSize:10 }}>{m.date}</span>
                <span className="num mut" style={{ fontSize:11, fontWeight:700 }}>{m.time}</span>
              </div>
              <div className="col" style={{ gap:6 }}>
                <div className="row gap6">
                  <Flag team={m.home} size={22} />
                  <span style={{ fontWeight:700, fontSize:13 }}>{DB.T[m.home].code}</span>
                  {totalPicks.includes(m.home) && <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--lime)',flexShrink:0 }} />}
                </div>
                <div className="row gap6">
                  <Flag team={m.away} size={22} />
                  <span style={{ fontWeight:700, fontSize:13 }}>{DB.T[m.away].code}</span>
                  {totalPicks.includes(m.away) && <span style={{ width:6,height:6,borderRadius:'50%',background:'var(--lime)',flexShrink:0 }} />}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* mini clasificación */}
      <WaveBand color="var(--lime)" height={12} opacity={0.40} thick={2} />
      <SecHead title="Clasificación" action="Completa" onAction={() => go('ranking')} />
      <div style={{ padding:'0 16px' }}>
        <div className="card" style={{ padding:6 }}>
          {top3.map(r => <LbMini key={r.rank} r={r} />)}
          {me.rank > 3 && (
            <>
              <div className="divline" style={{ margin:'4px 10px' }} />
              <LbMini r={me} />
            </>
          )}
        </div>
      </div>

      {/* actividad */}
      <SecHead title="Actividad de la liga" />
      <div style={{ padding:'0 20px' }}>
        <div className="card pad" style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {DB.activity.map((a,i) => (
            <div key={i} className="row gap14">
              <Av txt={a.av} col={a.col} size={38} />
              <div className="col" style={{ flex:1, gap:1 }}>
                <span style={{ fontSize:13.5, fontWeight:600 }}>
                  <b style={{ fontWeight:800 }}>{a.who}</b> {a.act}
                </span>
                <span className="mut" style={{ fontSize:12 }}>{a.detail} · {a.when}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* acceso reglamento */}
      <div style={{ padding:'14px 20px 0' }}>
        <button className="btn btn-ghost" style={{ height:46 }} onClick={openRules}>
          <Icon name="lock" size={18} /> Reglamento oficial
        </button>
      </div>

      <div style={{ height:24 }} />
    </div>
  );
}

function LbMini({ r }) {
  /* Colores médalla Brasil 2014 */
  const medalCol = ['#FDD301','#C0CDD8','#E08A4A'];
  return (
    <div className={'lb-row' + (r.me ? ' me' : '')} style={{ padding:'10px 12px' }}>
      <span className="lb-rank" style={r.rank<=3 ? { color:medalCol[r.rank-1], fontWeight:900 } : null}>{r.rank}</span>
      <Av txt={r.av} col={r.col} size={34} />
      <span style={{ flex:1, fontWeight:700, fontSize:14 }}>{r.name}</span>
      <div className="col" style={{ alignItems:'flex-end', gap:3 }}>
        <span className="bignum" style={{ fontSize:16, color:'var(--lime)' }}>{r.pts}</span>
        {/* Mini BarStack acento */}
        <BarStack
          colors={['var(--lime)','var(--gold)']}
          widths={[Math.min(100, r.pts / 2), Math.min(70, r.pts / 3)]}
          barH={2} gap={2} opacity={0.35} align="right"
        />
      </div>
    </div>
  );
}

Object.assign(window, { ScreenHome });
