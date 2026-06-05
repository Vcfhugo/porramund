/* ============================================================
   Pantalla SELECCIÓN — Elige tus 11 equipos + Dúo + Goleadores
   ============================================================ */

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
    passed: target <= now,
  };
}

window.useCountdown = useCountdown;

/* ============================================================
   Pantalla principal
   ============================================================ */
function ScreenPredict({ openRules, porraId }) {
  const DB = window.DB;
  const [picks, setPicks] = useState(() => {
    const saved = JSON.parse(JSON.stringify(DB.myPicks));
    /* Garantizar estructura completa aunque DB.myPicks esté vacío */
    return {
      g1: saved.g1 || [], g2: saved.g2 || [], g3: saved.g3 || [],
      g4: saved.g4 || [], g5: saved.g5 || null, g6: saved.g6 || [],
      goalscorer: saved.goalscorer || {},
      duo: saved.duo || [null, null],
    };
  });
  const [sub,          setSub]          = useState('grupos');
  const [saved,        setSaved]        = useState(true);
  const [isLocked,     setIsLocked]     = useState(() => DB.myPicksLocked === true);
  const [showLockModal,setShowLockModal]= useState(false);
  const [locking,      setLocking]      = useState(false);
  const [lockErr,      setLockErr]      = useState('');
  const cd     = useCountdown(DB.deadline.getTime());
  const closed = cd.passed;
  const frozen = closed || isLocked;   // no se puede editar si deadline pasado O ya confirmado
  const saveTimer = useRef(null);

  /* Cargar estado locked desde Supabase si aún no lo tenemos */
  useEffect(() => {
    if (DB.myPicksLocked === true) return;   // ya lo sabemos
    const lsKey = `picks_locked_${porraId || 'demo'}`;
    if (!window.SB || !porraId) {
      if (localStorage.getItem(lsKey) === 'true') setIsLocked(true);
      return;
    }
    window.SB.loadPicks(porraId).then(r => {
      if (r?.locked) { setIsLocked(true); DB.myPicksLocked = true; }
    }).catch(() => {});
  }, [porraId]);

  const getGroupArr = (id) =>
    id === 5 ? (picks.g5 ? [picks.g5] : []) : (picks['g' + id] || []);

  const teamsDone = [1,2,3,4,5,6].reduce((s,id) => s + getGroupArr(id).length, 0);
  const g1picks   = getGroupArr(1);
  const goalsDone = g1picks.filter(t => picks.goalscorer?.[t]).length;
  const duoDone   = (picks.duo || []).filter(Boolean).length;
  const pct       = Math.round((teamsDone / 11) * 100);

  const toggleTeam = (groupId, teamId, maxPick) => {
    if (frozen) return;
    if (groupId === 5) {
      setPicks(p => ({ ...p, g5: p.g5 === teamId ? null : teamId }));
    } else {
      const key = 'g' + groupId;
      setPicks(p => {
        const cur = p[key] || [];
        if (cur.includes(teamId)) return { ...p, [key]: cur.filter(t => t !== teamId) };
        if (cur.length >= maxPick) return p;
        return { ...p, [key]: [...cur, teamId] };
      });
    }
  };

  /* Sync en DB local + auto-save a Supabase con debounce (solo si no bloqueado) */
  useEffect(() => {
    DB.myPicks = picks;
    if (isLocked) return;   // no guardar si ya está confirmado
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const pid = porraId || window.currentPorraId;
      if (pid && window.SB) {
        await window.SB.savePicks(pid, picks);
      }
      setSaved(true);
    }, 900);
    return () => clearTimeout(saveTimer.current);
  }, [picks]);

  const urgentTime = !closed && !isLocked && cd.d === 0;
  const allComplete = teamsDone === 11 && duoDone === 2 && goalsDone === 2;

  const handleLock = async () => {
    setLockErr('');
    setLocking(true);
    try {
      const pid = porraId || window.currentPorraId;
      if (window.SB && pid) await window.SB.lockPicks(pid);
      localStorage.setItem(`picks_locked_${pid || 'demo'}`, 'true');
      DB.myPicksLocked = true;
      setIsLocked(true);
      setShowLockModal(false);
    } catch(e) {
      setLockErr('Error al confirmar: ' + e.message);
    }
    setLocking(false);
  };

  return (
    <div className="scroll no-sb">
      <div className="safe-top" />
      <div className="appbar">
        <div className="col" style={{ gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <span className="greet" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isLocked ? 'Selección confirmada' : closed ? 'Plazo cerrado' : 'Cierre 11 jun · 17:00 h'}
          </span>
          <span className="title">Tus selecciones</span>
        </div>
        <div className="spacer" />
        {isLocked ? (
          <span className="tag tag-pts" style={{ background:'rgba(var(--lime-rgb),.15)', color:'var(--lime)' }}>
            <Icon name="check" size={12} /> Bloqueada
          </span>
        ) : !closed ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999,
            border: `1px solid ${urgentTime ? 'rgba(216,19,26,.35)' : 'rgba(var(--lime-rgb),.3)'}`,
            background: urgentTime ? 'rgba(216,19,26,.12)' : 'rgba(var(--lime-rgb),.10)',
            color: urgentTime ? 'var(--coral)' : 'var(--lime)',
            fontFamily: "'Brasil2014Numeros', monospace", fontWeight: 700, fontSize: 12,
            flexShrink: 0,
          }}>
            <Icon name="clock" size={14} />
            {cd.d > 0 ? `${cd.d}d ${cd.h}h` : `${cd.h}h ${cd.m}m`}
          </div>
        ) : (
          <span className="tag tag-live">Cerrado</span>
        )}
        {!frozen && window.SB && (
          <span style={{ fontSize:11, fontWeight:700,
            color: saved ? 'var(--lime)' : 'var(--muted-2)',
            marginLeft:4, transition:'color .3s ease' }}>
            {saved ? <Icon name="check" size={13} /> : '···'}
          </span>
        )}
      </div>

      <BrasilBand />

      {/* banner locked */}
      {isLocked && (
        <div style={{
          margin:'8px 16px 0', padding:'11px 16px',
          background:'rgba(var(--lime-rgb),.10)', border:'1px solid rgba(var(--lime-rgb),.30)',
          borderRadius:12, display:'flex', alignItems:'center', gap:10,
        }}>
          <Icon name="check" size={18} style={{ color:'var(--lime)', flexShrink:0 }} />
          <div className="col" style={{ gap:2 }}>
            <span style={{ fontWeight:800, fontSize:13, color:'var(--lime)' }}>Selección confirmada y bloqueada</span>
            <span className="mut" style={{ fontSize:11, fontWeight:600 }}>Ya no puedes modificar tus selecciones</span>
          </div>
        </div>
      )}

      {/* progreso */}
      <div style={{ padding: '12px 20px 0' }}>
        <div className="card pad" style={{ background: 'var(--surface-2)' }}>
          <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 800, fontSize: 14 }}>Progreso de inscripción</span>
            <span className="bignum" style={{ color: 'var(--lime)', fontSize: 15 }}>{teamsDone}/11</span>
          </div>
          <div className="meter"><i style={{ width: pct + '%', transition: 'width .4s ease' }} /></div>
          <div className="row" style={{ marginTop: 12, gap: 12, flexWrap: 'wrap' }}>
            <ProgressChip done={teamsDone === 11} label="11 selecciones" />
            <ProgressChip done={duoDone === 2}    label="Dúo Dinámico" />
            <ProgressChip done={goalsDone === 2}  label="Goleadores G1" />
          </div>
        </div>
      </div>

      {/* botón confirmar */}
      {!frozen && allComplete && (
        <div style={{ padding:'10px 20px 0' }}>
          <button onClick={() => setShowLockModal(true)} style={{
            width:'100%', height:50, background:'var(--lime)', color:'var(--accent-ink)',
            border:'none', borderRadius:14, fontWeight:900, fontSize:15,
            cursor:'pointer', fontFamily:'inherit', display:'flex',
            alignItems:'center', justifyContent:'center', gap:8,
          }}>
            <Icon name="check" size={18} />
            Confirmar selección definitivamente
          </button>
          <p className="mut" style={{ fontSize:11, fontWeight:600, textAlign:'center', margin:'7px 0 0' }}>
            Después no podrás cambiar tus equipos
          </p>
        </div>
      )}

      {/* sub-tabs */}
      <div style={{ padding: '14px 20px 0' }}>
        <div className="subtab-bar">
          {[['grupos','Grupos'],['goles','Goleadores'],['duo','Dúo Dinámico']].map(([k,l]) => (
            <button key={k} className={'subtab' + (sub===k?' on':'')} onClick={()=>setSub(k)}>{l}</button>
          ))}
        </div>
      </div>

      {sub === 'grupos' && (
        <GroupsTab picks={picks} toggleTeam={toggleTeam} getGroupArr={getGroupArr} closed={frozen} openRules={openRules} />
      )}
      {sub === 'goles' && (
        <GoalscorersTab picks={picks} setPicks={setPicks} g1picks={g1picks} closed={frozen} />
      )}
      {sub === 'duo' && (
        <DuoTab picks={picks} setPicks={setPicks} g1picks={g1picks} closed={frozen} />
      )}

      <div style={{ height: 24 }} />

      {showLockModal && (
        <LockConfirmModal
          picks={picks} DB={DB}
          locking={locking} lockErr={lockErr}
          onConfirm={handleLock}
          onCancel={() => { setShowLockModal(false); setLockErr(''); }}
        />
      )}
    </div>
  );
}

function LockConfirmModal({ picks, DB, locking, lockErr, onConfirm, onCancel }) {
  const teams = [1,2,3,4,5,6].flatMap(id =>
    id === 5 ? (picks.g5 ? [picks.g5] : []) : (picks['g'+id] || []));
  const duo = (picks.duo || []).filter(Boolean).map(id => DB.players.find(p => p.id === id)).filter(Boolean);
  const gsEntries = Object.entries(picks.goalscorer || {}).filter(([,v]) => v)
    .map(([tid, pid]) => ({ team: DB.T[tid], player: DB.players.find(p => p.id === pid) }));

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:300,
      background:'rgba(0,20,40,.78)', display:'flex',
      flexDirection:'column', justifyContent:'flex-end',
    }}>
      <div style={{
        background:'var(--bg)', borderRadius:'20px 20px 0 0',
        padding:'22px 20px 32px', maxHeight:'82vh', overflowY:'auto',
      }}>
        <div className="row gap10" style={{ marginBottom:6 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(216,19,26,.15)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name="shield" size={18} style={{ color:'var(--coral)' }} />
          </div>
          <div className="col" style={{ gap:1 }}>
            <span style={{ fontWeight:900, fontSize:17 }}>Confirmar selección</span>
            <span className="mut" style={{ fontSize:12, fontWeight:600 }}>Esta acción es irreversible</span>
          </div>
        </div>

        <p className="mut" style={{ fontSize:13, fontWeight:600, margin:'12px 0 16px', lineHeight:1.5 }}>
          Una vez confirmada, <b style={{ color:'var(--coral)' }}>no podrás cambiar</b> ninguno de tus equipos, goleadores ni el Dúo Dinámico.
        </p>

        <div style={{ background:'var(--surface-2)', borderRadius:12, padding:'12px 14px', marginBottom:12 }}>
          <span className="mut" style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', display:'block', marginBottom:10 }}>
            TUS {teams.length} EQUIPOS
          </span>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {teams.map(id => {
              const t = DB.T[id];
              if (!t) return null;
              return (
                <div key={id} style={{ display:'flex', alignItems:'center', gap:5,
                  background:'var(--surface-3)', borderRadius:7, padding:'5px 9px' }}>
                  <Flag team={t} size={18} />
                  <span style={{ fontWeight:800, fontSize:12 }}>{t.code}</span>
                </div>
              );
            })}
          </div>
        </div>

        {(duo.length > 0 || gsEntries.length > 0) && (
          <div style={{ background:'var(--surface-2)', borderRadius:12, padding:'10px 14px', marginBottom:16 }}>
            {gsEntries.length > 0 && (
              <div style={{ marginBottom: duo.length > 0 ? 10 : 0 }}>
                <span className="mut" style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', display:'block', marginBottom:6 }}>
                  GOLEADORES G1
                </span>
                {gsEntries.map(({ team, player }) => team && player ? (
                  <span key={team.id} style={{ fontSize:12, fontWeight:700, display:'block' }}>
                    {team.code}: {player.name}
                  </span>
                ) : null)}
              </div>
            )}
            {duo.length > 0 && (
              <div>
                <span className="mut" style={{ fontSize:10, fontWeight:800, letterSpacing:'.08em', display:'block', marginBottom:6 }}>
                  DÚO DINÁMICO
                </span>
                <span style={{ fontSize:12, fontWeight:700 }}>{duo.map(p => p.name).join(' · ')}</span>
              </div>
            )}
          </div>
        )}

        {lockErr && (
          <p style={{ color:'var(--coral)', fontSize:12, fontWeight:700, margin:'0 0 12px' }}>{lockErr}</p>
        )}

        <div className="row gap8">
          <button className="btn btn-ghost" style={{ flex:1, height:48 }} onClick={onCancel} disabled={locking}>
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={locking} style={{
            flex:2, height:48, background:'var(--coral)', color:'#fff',
            border:'none', borderRadius:12, fontWeight:900, fontSize:14,
            cursor: locking ? 'default' : 'pointer', fontFamily:'inherit',
            opacity: locking ? .7 : 1,
          }}>
            {locking ? 'Confirmando…' : 'Sí, confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressChip({ done, label }) {
  return (
    <div className="row gap6" style={{ fontSize: 11, fontWeight: 700, color: done ? 'var(--lime)' : 'var(--muted)' }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%',
        background: done ? 'var(--lime)' : 'var(--surface-3)', flexShrink: 0 }} />
      {label}
    </div>
  );
}

/* ============================================================
   TAB GRUPOS
   ============================================================ */
function GroupsTab({ picks, toggleTeam, getGroupArr, closed, openRules }) {
  const DB = window.DB;
  return (
    <>
      <div style={{ padding: '14px 20px 0' }}>
        <p className="mut" style={{ fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          <b style={{ color: 'var(--lime)' }}>2 equipos</b> de los grupos 1–4 ·{' '}
          <b style={{ color: 'var(--orange)' }}>1 equipo</b> del G5 (<b style={{ color:'var(--orange)' }}>×2.5</b>) ·{' '}
          <b style={{ color: 'var(--lime)' }}>2 equipos</b> del G6 (<b style={{ color:'var(--orange)' }}>×2</b>) = <b style={{ color:'var(--lime)' }}>11 selecciones</b>.{' '}
          <span onClick={openRules} style={{ color: 'var(--orange)', cursor: 'pointer', fontWeight: 700 }}>Reglamento →</span>
        </p>
      </div>

      {DB.porraGroups.map(g => {
        const selected = getGroupArr(g.id);
        const full = selected.length >= g.pick;
        const hasMultiplier = g.multiplier && g.multiplier > 1;
        return (
          <div key={g.id} style={{ padding: '14px 16px 0' }}>
            <div className="card" style={{ overflow: 'hidden',
              borderColor: hasMultiplier ? 'rgba(247,149,22,.4)' : undefined }}>
              <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: (g.col || 'var(--lime)') + '11',
                position: 'relative', overflow: 'hidden' }}>
                <TriFlag size={40} color={g.col || 'var(--lime)'} position="tr" opacity={0.55} />
                <div className="row gap10">
                  <div style={{
                    width:32, height:32, borderRadius:8, flexShrink:0,
                    background: (g.col || 'var(--lime)') + '22',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color: g.col || 'var(--lime)',
                  }}>
                    <Icon name={g.icon || 'trophy'} size={17} />
                  </div>
                  <div className="col" style={{ gap: 1 }}>
                    <div className="row gap8">
                      <span style={{ fontWeight: 900, fontSize: 15 }}>Grupo {g.id} · {g.name}</span>
                      {hasMultiplier && (
                        <span style={{ background:'rgba(247,149,22,.25)', color:'var(--orange)',
                          fontWeight:900, fontSize:11, padding:'2px 7px', borderRadius:6,
                          fontFamily:"'Brasil2014Numeros',monospace" }}>x{g.multiplier}</span>
                      )}
                    </div>
                    <span className="mut" style={{ fontSize: 11, fontWeight: 700 }}>
                      Elige {g.pick}{g.id===5?' (solo 1 · puntos x2.5)':''} · {selected.length}/{g.pick} seleccionados
                    </span>
                  </div>
                </div>
                {selected.length === g.pick && (
                  <span className="tag tag-pts"><Icon name="check" size={12} /> listo</span>
                )}
              </div>

              <div className="team-picks-list" style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {g.teams.map(teamId => {
                  const t   = DB.T[teamId];
                  const sel = selected.includes(teamId);
                  const maxed = full && !sel;
                  return (
                    <div key={teamId}
                      className={'team-pick' + (sel ? ' selected' : '') + (maxed ? ' maxed' : '')}
                      onClick={() => !maxed || sel ? toggleTeam(g.id, teamId, g.pick) : null}>
                      <div className="pick-check">
                        {sel && <Icon name="check" size={12} style={{ color: 'var(--accent-ink)' }} />}
                      </div>
                      <Flag team={t} size={28} />
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{t.name}</span>
                      <span className="mut num" style={{ fontSize: 12 }}>{t.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

/* ============================================================
   TAB GOLEADORES
   ============================================================ */
function GoalscorersTab({ picks, setPicks, g1picks, closed }) {
  const DB = window.DB;
  const [searches, setSearches] = useState({});

  if (g1picks.length < 2) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ width:64, height:64, borderRadius:20, background:'rgba(var(--lime-rgb),.10)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--lime)', marginBottom:16, marginInline:'auto' }}>
        <Icon name="ball" size={32} sw={1.8} />
      </div>
        <p style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px' }}>
          {g1picks.length === 0
            ? 'Primero elige tus 2 equipos del Grupo 1'
            : 'Elige tu segundo equipo del Grupo 1'}
        </p>
        <p className="mut" style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
          Grupo 1 · La Grasa Papa (ARG, FRA, BRA, ENG, ESP, POR)
        </p>
        {g1picks.length === 1 && (
          <div className="row gap8" style={{ justifyContent: 'center', marginTop: 14 }}>
            <Flag team={DB.T[g1picks[0]]} size={24} />
            <span style={{ fontWeight: 700, fontSize: 13 }}>{DB.T[g1picks[0]].name} seleccionado</span>
          </div>
        )}
      </div>
    );
  }

  const setGoalscorer = (teamId, playerId) => {
    if (closed) return;
    setPicks(p => ({
      ...p,
      goalscorer: {
        ...p.goalscorer,
        [teamId]: p.goalscorer?.[teamId] === playerId ? null : playerId,
      },
    }));
  };

  return (
    <>
      <div style={{ padding: '14px 20px 0' }}>
        <div className="card" style={{ padding: '13px 16px', background: 'rgba(var(--lime-rgb),.06)',
          borderColor: 'rgba(var(--lime-rgb),.25)' }}>
          <div className="row gap10">
            <Icon name="target" size={20} style={{ color: 'var(--lime)', flexShrink: 0 }} />
            <div className="col" style={{ gap: 2 }}>
              <span style={{ fontWeight: 800, fontSize: 13.5 }}>Pichichi de tus equipos del G1</span>
              <span className="mut" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                Un goleador por equipo · +5 pts si aciertas uno · <b style={{ color: 'var(--lime)' }}>+10 pts</b> si aciertas los dos
              </span>
            </div>
          </div>
        </div>
      </div>

      {g1picks.map(teamId => {
        const t = DB.T[teamId];
        const q = (searches[teamId] || '').toLowerCase();
        const allTeamPlayers = DB.players.filter(p => p.team === teamId);
        const teamPlayers = q
          ? allTeamPlayers.filter(p => p.name.toLowerCase().includes(q) || (p.fullName||'').toLowerCase().includes(q))
          : allTeamPlayers;
        const cur = picks.goalscorer?.[teamId] ?? null;
        return (
          <div key={teamId} style={{ padding: '14px 16px 0' }}>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)',
                display: 'flex', alignItems: 'center', gap: 12 }}>
                <Flag team={t} size={30} />
                <div className="col" style={{ flex: 1, gap: 1 }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</span>
                  <span className="mut" style={{ fontSize: 11.5, fontWeight: 600 }}>
                    {cur ? `✓ ${DB.players.find(p => p.id === cur)?.name}` : 'Elige su máximo goleador'}
                  </span>
                </div>
                {cur && <span className="tag tag-pts"><Icon name="check" size={12} /></span>}
              </div>
              {allTeamPlayers.length > 8 && (
                <div style={{ padding: '8px 10px 4px', borderBottom: '1px solid var(--line)' }}>
                  <input
                    type="text"
                    placeholder="Buscar jugador…"
                    value={searches[teamId] || ''}
                    onChange={e => setSearches(s => ({ ...s, [teamId]: e.target.value }))}
                    style={{
                      width: '100%', background: 'var(--surface-3)', border: '1px solid var(--line)',
                      borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'var(--text)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              )}
              <div style={{ padding: '6px 10px', maxHeight: 280, overflowY: 'auto' }}>
                {teamPlayers.length === 0 ? (
                  <p className="mut" style={{ padding: '10px 8px', fontSize: 12, margin: 0 }}>
                    {allTeamPlayers.length === 0 ? 'Sin jugadores disponibles.' : 'Sin resultados.'}
                  </p>
                ) : teamPlayers.map(pl => {
                  const sel = cur === pl.id;
                  return (
                    <div key={pl.id} className={'player-pick' + (sel ? ' selected' : '')}
                      style={{ cursor: closed ? 'default' : 'pointer' }}
                      onClick={() => setGoalscorer(teamId, pl.id)}>
                      <div className="player-radio">
                        {sel && <Icon name="check" size={11} style={{ color: 'var(--accent-ink)' }} />}
                      </div>
                      <div className="col" style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{pl.name}</span>
                        {pl.club && <span className="mut" style={{ fontSize: 11, fontWeight: 600 }}>{pl.club}</span>}
                      </div>
                      <PosBadge pos={pl.pos} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function PosBadge({ pos }) {
  if (!pos) return null;
  const colors = { GK:'#F79516', DEF:'#4DA6FF', MID:'#ABCB2D', FWD:'#D8131A' };
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 5,
      background: (colors[pos] || 'var(--surface-3)') + '22',
      color: colors[pos] || 'var(--muted)',
      fontFamily: "'Brasil2014Numeros', monospace", flexShrink: 0,
    }}>{pos}</span>
  );
}

/* ============================================================
   TAB DÚO DINÁMICO
   ============================================================ */
function DuoTab({ picks, setPicks, closed }) {
  const DB = window.DB;
  const duo = picks.duo || [null, null];
  const g1InDuo = duo.filter(id => id && DB.players.find(p => p.id === id && p.g1)).length;
  const totalInDuo = duo.filter(Boolean).length;

  const [query, setQuery] = useState('');
  const [posFilter, setPosFilter] = useState('');

  const selectPlayer = (playerId) => {
    if (closed) return;
    const pl = DB.players.find(x => x.id === playerId);
    const isG1 = pl?.g1;
    setPicks(prev => {
      const prevDuo = prev.duo || [null, null];
      if (prevDuo.includes(playerId)) {
        return { ...prev, duo: prevDuo.map(d => d === playerId ? null : d) };
      }
      const prevG1InDuo = prevDuo.filter(id => id && DB.players.find(p => p.id === id && p.g1)).length;
      const prevTotal = prevDuo.filter(Boolean).length;
      if (isG1 && prevG1InDuo >= 1) return prev;
      if (prevTotal >= 2) return prev;
      const slot = prevDuo[0] === null ? 0 : 1;
      const nd = [...prevDuo]; nd[slot] = playerId;
      return { ...prev, duo: nd };
    });
  };

  const q = query.toLowerCase();
  const filterFn = pl => {
    const matchPos = !posFilter || pl.pos === posFilter;
    const matchQ = !q || pl.name.toLowerCase().includes(q) || (pl.fullName||'').toLowerCase().includes(q)
      || (DB.T[pl.team]?.name || '').toLowerCase().includes(q);
    return matchPos && matchQ;
  };

  const g1Players   = DB.players.filter(p => p.g1 && filterFn(p));
  const restPlayers = DB.players.filter(p => !p.g1 && filterFn(p));
  const isFiltering = q || posFilter;

  return (
    <>
      <div style={{ padding: '14px 20px 0' }}>
        <div className="card" style={{ padding: '14px 16px', background: 'rgba(247,149,22,.07)',
          borderColor: 'rgba(247,149,22,.3)' }}>
          <div className="row gap10" style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontWeight: 900, fontSize: 14.5 }}>El Dúo Dinámico</span>
          </div>
          <p className="mut" style={{ fontSize: 13, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
            2 jugadores · máx. 1 del Grupo 1 · sus goles + asistencias = pts extra directos a tu marcador.
          </p>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface-3)',
            borderRadius: 11, fontSize: 12.5 }}>
            <span className="mut">Ejemplo: Yamal 3G+2A + Doku 1G+3A = </span>
            <b style={{ color: 'var(--orange)' }}>+9 puntos</b>
          </div>
        </div>

        {/* slots seleccionados */}
        <div className="row gap10" style={{ marginTop: 14 }}>
          {[0,1].map(i => {
            const pid = duo[i];
            const pl  = pid ? DB.players.find(p => p.id === pid) : null;
            const t   = pl ? DB.T[pl.team] : null;
            return (
              <div key={i} style={{
                flex: 1, borderRadius: 14,
                border: `1.5px ${pl ? 'solid' : 'dashed'}`,
                borderColor: pl ? 'rgba(var(--lime-rgb),.4)' : 'var(--line-2)',
                background: pl ? 'rgba(var(--lime-rgb),.06)' : 'var(--surface-2)',
                padding: '12px 13px', minHeight: 60,
                display: 'flex', alignItems: 'center', gap: 9,
              }}>
                {pl ? (
                  <>
                    <Flag team={t} size={24} />
                    <div className="col" style={{ flex: 1, gap: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: 12.5 }}>{pl.name}</span>
                      <span className="mut" style={{ fontSize: 10.5, fontWeight: 600 }}>
                        {t.name}{pl.g1 ? ' · G1' : ''}
                        {(pl.goals > 0 || pl.assists > 0) ? ` · ${pl.goals}G ${pl.assists}A` : ''}
                      </span>
                    </div>
                    {!closed && (
                      <button onClick={() => selectPlayer(pid)}
                        style={{ background:'none',border:'none',color:'var(--muted-2)',cursor:'pointer',padding:2 }}>
                        <Icon name="plus" size={15} style={{ transform:'rotate(45deg)' }} />
                      </button>
                    )}
                  </>
                ) : (
                  <span className="mut" style={{ fontSize: 12.5, fontWeight: 700 }}>
                    {i===0 ? 'Jugador 1' : 'Jugador 2'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {totalInDuo === 2 && (
          <div className="tag tag-green" style={{ marginTop: 10, fontSize: 12, padding: '6px 12px' }}>
            <Icon name="check" size={13} /> Dúo completo
          </div>
        )}

        {/* buscador + filtro posición */}
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Buscar jugador o selección…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              flex: 1, background: 'var(--surface-2)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '9px 12px', fontSize: 13, color: 'var(--text)',
              outline: 'none',
            }}
          />
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--line)',
              borderRadius: 10, padding: '9px 10px', fontSize: 12, color: posFilter ? 'var(--text)' : 'var(--muted)',
              outline: 'none', cursor: 'pointer', fontWeight: 700,
            }}
          >
            <option value="">Pos.</option>
            <option value="GK">GK</option>
            <option value="DEF">DEF</option>
            <option value="MID">MID</option>
            <option value="FWD">FWD</option>
          </select>
        </div>
      </div>

      {/* lista G1 */}
      {g1Players.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div className="sec-head" style={{ padding:0, marginBottom:10 }}>
            <h2>Del Grupo 1 (máx. 1)</h2>
            {g1InDuo >= 1 && <span className="tag tag-warn" style={{ fontSize: 10 }}>cupo lleno</span>}
          </div>
          <div className="card" style={{ padding: '4px 6px' }}>
            {g1Players.map(pl => (
              <DuoRow key={pl.id} pl={pl} duo={duo} onSelect={selectPlayer}
                disabled={(g1InDuo >= 1 && !duo.includes(pl.id)) || (totalInDuo >= 2 && !duo.includes(pl.id))} />
            ))}
          </div>
        </div>
      )}

      {/* lista resto */}
      {restPlayers.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <div className="sec-head" style={{ padding:0, marginBottom:10 }}>
            <h2>{isFiltering ? 'Resto del mundo' : 'Fuera del Grupo 1'}</h2>
          </div>
          <div className="card" style={{ padding: '4px 6px' }}>
            {restPlayers.map(pl => (
              <DuoRow key={pl.id} pl={pl} duo={duo} onSelect={selectPlayer}
                disabled={totalInDuo >= 2 && !duo.includes(pl.id)} />
            ))}
          </div>
        </div>
      )}

      {isFiltering && g1Players.length === 0 && restPlayers.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Sin resultados</p>
        </div>
      )}
    </>
  );
}

function DuoRow({ pl, duo, onSelect, disabled }) {
  const t   = window.DB.T[pl.team];
  const sel = duo.includes(pl.id);
  return (
    <div className={'player-pick' + (sel ? ' selected' : '')}
      style={{ opacity: disabled && !sel ? 0.35 : 1, cursor: disabled && !sel ? 'default' : 'pointer' }}
      onClick={() => { if (!disabled || sel) onSelect(pl.id); }}>
      <div className="player-radio">
        {sel && <Icon name="check" size={11} style={{ color: 'var(--accent-ink)' }} />}
      </div>
      <Flag team={t} size={26} />
      <div className="col" style={{ flex:1, gap:1 }}>
        <span style={{ fontWeight:700, fontSize:14 }}>{pl.name}</span>
        <span className="mut" style={{ fontSize:11.5, fontWeight:600 }}>{t.name}</span>
      </div>
      <PosBadge pos={pl.pos} />
      {(pl.goals > 0 || pl.assists > 0) && (
        <span className="mut" style={{ fontSize:11, fontWeight:700, fontFamily:"'Brasil2014Numeros',monospace", marginLeft:4 }}>
          {pl.goals}G {pl.assists}A
        </span>
      )}
    </div>
  );
}

Object.assign(window, { ScreenPredict, useCountdown });
