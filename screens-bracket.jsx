/* ============================================================
   Pantalla BRACKET (eliminatorias) + Campeón + Pichichi
   ============================================================ */

/* Convierte filas de wc_matches a formato {h, a, win, score, status, id} */
function matchesToBracket(rows, round) {
  return rows
    .filter(m => m.round === round)
    .sort((a, b) => a.id < b.id ? -1 : 1)
    .map(m => ({
      id:     m.id,
      h:      m.home  || '?',
      a:      m.away  || '?',
      win:    m.status === 'finished' && m.home_score !== null
                ? (m.home_score >= m.away_score ? m.home : m.away)
                : null,
      score:  m.home_score !== null ? `${m.home_score}–${m.away_score}` : null,
      status: m.status,
    }));
}

function ScreenBracket({ isAdmin }) {
  const DB = window.DB;
  const [realMatches, setRealMatches] = useState(null);
  const [champ, setChamp] = useState(DB.bracket.champion);

  const myTeams = [1,2,3,4,5,6].flatMap(id =>
    id === 5 ? (DB.myPicks.g5 ? [DB.myPicks.g5] : []) : (DB.myPicks['g'+id] || []));
  const [pichichi, setPichichi] = useState(
    DB.myPicks.duo?.[0] || (DB.players && DB.players[0]?.id) || 'mbappe');

  /* wins: predicciones del usuario para partidos no jugados */
  const [wins, setWins] = useState(() => {
    const w = {};
    ['r16', 'qf', 'sf', 'final'].forEach(r =>
      (DB.bracket[r] || []).forEach((m, i) => { if (m.win) w[r + i] = m.win; })
    );
    return w;
  });
  const setWin = (round, key, team) => setWins(p => ({ ...p, [round + key]: team }));

  /* Carga datos reales de Supabase */
  useEffect(() => {
    if (!window.SB) return;
    window.SB.getMatches().then(rows => {
      const knockout = rows.filter(m => ['r32','r16','qf','sf','final'].includes(m.round));
      if (knockout.length === 0) return;
      setRealMatches(knockout);
      /* Actualizar campeón si la final está terminada */
      const final = knockout.find(m => m.round === 'final' && m.status === 'finished');
      if (final && final.home_score !== null) {
        setChamp(final.home_score >= final.away_score ? final.home : final.away);
      }
    }).catch(() => {});
  }, []);

  /* Construir columnas del bracket */
  const buildCol = (round) => realMatches
    ? matchesToBracket(realMatches, round)
    : (DB.bracket[round] || []).map((m, i) => ({ id: round+i, h:m.h, a:m.a, win:m.win, score:null, status:'upcoming' }));

  const r32Data   = buildCol('r32');
  const r16Data   = buildCol('r16');
  const qfData    = buildCol('qf');
  const sfData    = buildCol('sf');
  const finalData = buildCol('final');

  const finalists = ['arg', 'fra', 'bra', 'eng', 'esp', 'por', 'ale', 'mar'];

  return (
    <div className="scroll no-sb">
      <div className="safe-top" />
      <div className="appbar">
        <div className="col" style={{ gap: 1 }}>
          <span className="greet">Fase eliminatoria</span>
          <span className="title">Tu bracket</span>
        </div>
        <div className="spacer" />
        <button className="icon-btn"><Icon name="share" size={19} /></button>
      </div>

      <BrasilBand />

      {/* CAMPEÓN */}
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ position: 'relative', overflow: 'hidden',
          background:'rgba(var(--gold-rgb),.08)', borderColor:'rgba(var(--gold-rgb),.3)' }}>
          <GeomCorner size={100} color="#FDD301" position="tr" />
          <div className="pad" style={{ position: 'relative' }}>
            <div className="row gap10" style={{ color: 'var(--gold)', marginBottom: 14 }}>
              <Icon name="trophy" size={20} />
              <span className="up" style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.12em' }}>Tu campeón del mundo · 25 pts</span>
            </div>
            <div className="row gap14" style={{ alignItems: 'center', marginBottom: 16 }}>
              <Flag team={champ} size={64} />
              <div className="col" style={{ gap: 2 }}>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-.02em' }}>{DB.T[champ].name}</span>
                <span className="mut" style={{ fontSize: 13, fontWeight: 600 }}>Levanta la copa en MetLife</span>
              </div>
            </div>
            {isAdmin && (
              <div className="chips no-sb" style={{ padding: 0, gap: 8 }}>
                {finalists.map(t => (
                  <button key={t} onClick={() => setChamp(t)} style={{
                    flex: 'none', border: champ === t ? '2px solid var(--gold)' : '1px solid var(--line-2)',
                    background: champ === t ? 'rgba(255,199,64,.15)' : 'var(--surface-2)',
                    borderRadius: 12, padding: '6px 8px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Flag team={t} size={22} ring={false} />
                    <span style={{ fontWeight: 800, fontSize: 12.5, color: champ === t ? 'var(--gold)' : 'var(--text)' }}>{DB.T[t].code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DiagBlock color="var(--navy)" height={20} opacity={0.10} reverse />

      {/* BRACKET */}
      <SecHead title="Cuadro de eliminatorias"
        action={realMatches ? `${realMatches.filter(m=>m.status==='finished').length} jugados` : 'Mock'} />
      <div className="bracket no-sb">
        {r32Data.length > 0 && (
          <BkCol title="R32" round="r32" data={r32Data} wins={wins} setWin={isAdmin ? setWin : null} myTeams={myTeams} />
        )}
        <BkCol title="Octavos" round="r16" data={r16Data} wins={wins} setWin={isAdmin ? setWin : null} myTeams={myTeams} />
        <BkCol title="Cuartos" round="qf"  data={qfData}  wins={wins} setWin={isAdmin ? setWin : null} myTeams={myTeams} />
        <BkCol title="Semis"   round="sf"  data={sfData}  wins={wins} setWin={isAdmin ? setWin : null} myTeams={myTeams} />
        <BkCol title="Final"   round="final" data={finalData} wins={wins} setWin={isAdmin ? setWin : null} champ myTeams={myTeams} />
      </div>

      {/* DÚO DINÁMICO — jugadores elegidos */}
      <SecHead title="Dúo Dinámico" action="ver selección" />
      <div style={{ padding: '0 16px' }}>
        <div className="card" style={{ padding: 6 }}>
          {(DB.myPicks.duo || []).map((pid, i) => {
            if (!pid) return (
              <div key={i} style={{ padding:'12px 14px', display:'flex', alignItems:'center', gap:12, opacity:.4 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', border:'2px dashed var(--line-2)' }} />
                <span className="mut" style={{ fontSize:14, fontWeight:700 }}>Jugador {i+1} — pendiente</span>
              </div>
            );
            const pl = DB.players.find(p => p.id === pid);
            if (!pl) return null;
            const on = pichichi === pid;
            return (
              <button key={pid} onClick={() => setPichichi(pid)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 12px',
                background: on ? 'rgba(var(--lime-rgb),.1)' : 'transparent', border:'none', cursor:'pointer',
                borderRadius:14, fontFamily:'inherit', color:'inherit',
              }}>
                <div style={{
                  width:22, height:22, borderRadius:'50%', flex:'none',
                  border: on ? '6px solid var(--lime)' : '2px solid var(--line-2)',
                  background: on ? 'var(--lime)' : 'transparent', transition:'all .15s',
                }} />
                <Flag team={pl.team} size={28} />
                <div className="col" style={{ flex:1, alignItems:'flex-start', gap:1 }}>
                  <span style={{ fontWeight:800, fontSize:14.5 }}>{pl.name}</span>
                  <span className="mut" style={{ fontSize:12, fontWeight:600 }}>{DB.T[pl.team].name}{pl.g1 ? ' · Grupo 1' : ''}</span>
                </div>
                <div className="col" style={{ alignItems:'flex-end' }}>
                  <span className="bignum" style={{ fontSize:18, color: on ? 'var(--lime)' : 'var(--text)' }}>{pl.goals + pl.assists}</span>
                  <span className="mut" style={{ fontSize:10.5, fontWeight:700 }}>G+A</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function BkCol({ title, round, data, wins, setWin, champ, myTeams }) {
  const DB = window.DB;
  return (
    <div className="bk-col">
      <div className="rnd">{title}</div>
      {data.map((m, i) => {
        const wKey = round + (m.id ?? i);
        /* Si el partido tiene resultado real, úsalo; si no, usa la predicción del usuario */
        const w = m.win || wins[wKey];
        const isFinished = m.status === 'finished';
        return (
          <div key={m.id ?? i}>
            <div className="bk-match">
              {[m.h, m.a].map(t => {
                const tbd    = t === '?';
                const isWin  = !tbd && w === t;
                const isMine = !tbd && myTeams && myTeams.includes(t);
                const tData  = !tbd ? DB.T[t] : null;
                return (
                  <div key={t} className={'bk-team' + (isWin ? ' win' : '') + (isMine && !isWin ? ' mine' : '')}
                    onClick={() => !tbd && !isFinished && setWin && setWin(round, m.id ?? i, t)}
                    style={{ cursor: tbd || isFinished || !setWin ? 'default' : 'pointer', opacity: tbd ? 0.4 : 1 }}>
                    {tbd
                      ? <div style={{ width:22, height:15, borderRadius:3,
                          background:'var(--surface-3)', border:'1px solid var(--line)' }} />
                      : <Flag team={t} size={22} />
                    }
                    <span className="nm" style={{ flex: 1, color: tbd ? 'var(--muted)' : undefined }}>
                      {tbd ? 'Por det.' : tData?.name || t.toUpperCase()}
                    </span>
                    {isMine && !isWin && <span style={{ fontSize:9, fontWeight:800, color:'rgba(var(--lime-rgb),.6)', letterSpacing:'.04em' }}>MÍO</span>}
                    {isWin && <Icon name="check" size={15} style={{ color: 'var(--lime)' }} />}
                  </div>
                );
              })}
              {/* Score real debajo del match */}
              {m.score && (
                <div style={{ textAlign:'center', fontSize:11, fontWeight:800, fontFamily:"'Brasil2014Numeros',monospace",
                  color: isFinished ? 'var(--text)' : 'var(--coral)', padding:'2px 0 0',
                  borderTop:'1px solid var(--line)' }}>
                  {m.score}
                </div>
              )}
            </div>
            {champ && (
              <div className="row gap6" style={{ justifyContent: 'center', marginTop: 12, color: 'var(--gold)' }}>
                <Icon name="trophy" size={16} />
                <span style={{ fontWeight: 800, fontSize: 12.5 }}>Campeón</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { ScreenBracket });
