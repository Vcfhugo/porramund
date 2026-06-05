/* ============================================================
   Pantalla RANKING / Clasificación
   ============================================================ */
function ScreenRanking({ league, openLeagues, currentPorra }) {
  const DB = window.DB;
  const [scope, setScope] = useState('liga');
  const [realLb, setRealLb] = useState(null);

  useEffect(() => {
    if (!window.SB || !currentPorra?.id) return;
    window.SB.leaderboard(currentPorra.id).then(rows => {
      if (!rows || rows.length === 0) return;
      const mapped = rows.map((r, i) => ({
        rank:  i + 1,
        name:  r.display_name || 'Jugador',
        user:  '',
        pts:   r.scores?.[0]?.total_pts ?? 0,
        av:    (r.display_name || '?').slice(0,2).toUpperCase(),
        col:   ['#D8131A','#27E5D4','#8C6BFF','#FDD301','#F79516','#ABCB2D','#4DA6FF'][i % 7],
        trend: '0',
        exact: 0,
        me:    false,
      }));
      setRealLb(mapped);
    }).catch(() => {});
  }, [currentPorra?.id]);

  const lb = realLb || DB.leaderboard;
  const podium = [lb[1], lb[0], lb[2]]; // 2,1,3
  const rest = lb.slice(3);

  return (
    <div className="scroll no-sb">
      <div className="safe-top" />
      <div className="appbar">
        <div className="col" style={{ gap: 1 }}>
          <span className="greet">Jornada 3 · {league.members} jugadores</span>
          <span className="title">Clasificación</span>
        </div>
        <div className="spacer" />
        <button className="icon-btn" onClick={openLeagues}><Icon name="users" size={20} /></button>
      </div>

      <BrasilBand />

      <div className="chips no-sb">
        {[['liga', 'Mi liga'], ['amigos', 'Amigos'], ['global', 'Global'], ['jornada', 'Esta jornada']].map(([k, l]) => (
          <button key={k} className={'chip' + (scope === k ? ' on' : '')} onClick={() => setScope(k)}>{l}</button>
        ))}
      </div>

      <DiagBlock color="var(--lime)" height={22} opacity={0.12} />

      {/* podium — Brasil 2014 gold/silver/bronze */}
      <div style={{ padding: '18px 20px 0', background:'rgba(var(--lime-rgb),.05)',
        borderBottom:'1px solid var(--line)', position:'relative', overflow:'hidden' }}>
        <ArcBand size={320} color="var(--gold)" thickness={18} opacity={0.09} position="tr" />
        <div className="row" style={{ alignItems: 'flex-end', gap: 8, justifyContent: 'center' }}>
          {podium.map((r) => {
            if (!r) return null;
            const place = r.rank;
            const h     = place === 1 ? 88 : place === 2 ? 68 : 52;
            /* Colores médalla inspirados en Brasil 2014 */
            const medal = place === 1
              ? { bg:'#FDD301', text:'#2A1A00', border:'#C9A900' }
              : place === 2
              ? { bg:'#D8E8EC', text:'#1A3040', border:'#B0C8D0' }
              : { bg:'#E8A46A', text:'#3A1800', border:'#C07830' };
            return (
              <div key={r.rank} className="col" style={{ alignItems: 'center', flex: 1, gap: 6 }}>
                {/* corona / icono de posición */}
                <div style={{ height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {place === 1
                    ? <Icon name="crown" size={22} style={{ color:'var(--gold)' }} />
                    : <span className="bignum" style={{ fontSize:16, color:'var(--muted-2)' }}>{place}</span>
                  }
                </div>
                {/* avatar con borde de medalla */}
                <div style={{ borderRadius:16, padding:2.5,
                  background:medal.bg, boxShadow:`0 2px 8px ${medal.bg}66` }}>
                  <Av txt={r.av} col={r.col} size={place===1?60:48} r={13} />
                </div>
                <div className="col" style={{ alignItems:'center', gap:1 }}>
                  <span style={{ fontWeight:800, fontSize:12, textAlign:'center',
                    maxWidth:72, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.name.split(' ')[0]}
                  </span>
                  <span className="bignum" style={{ fontSize:16, color:'var(--lime)' }}>{r.pts}</span>
                </div>
                {/* columna del podio */}
                <div style={{
                  width:'100%', height:h, borderRadius:'10px 10px 0 0',
                  background: medal.bg + '28',
                  border:`1px solid ${medal.border}44`, borderBottom:'none',
                  display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:8,
                }}>
                  <span className="bignum" style={{ fontSize:28, color: medal.bg === '#FDD301' ? '#C9A900' : medal.border }}>{place}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* lista resto */}
      <div style={{ padding: '8px 16px 0' }}>
        <div className="card" style={{ padding: 6 }}>
          {rest.map(r => (
            <div key={r.rank} className={'lb-row' + (r.me ? ' me' : '')}>
              <span className="lb-rank">{r.rank}</span>
              <Av txt={r.av} col={r.col} size={40} />
              <div className="col" style={{ flex: 1, gap: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 14.5 }}>{r.name}</span>
                <span className="mut" style={{ fontSize: 12, fontWeight: 600 }}>{r.exact} plenos · {r.user}</span>
              </div>
              <Trend t={r.trend} />
              <span className="bignum" style={{ fontSize: 18, fontWeight: 700, minWidth: 38, textAlign: 'right' }}>{r.pts}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function Trend({ t }) {
  if (t === '0' || t === 0) return <span className="mut" style={{ fontSize: 12, fontWeight: 700, width: 26, textAlign: 'center' }}>–</span>;
  const up = String(t).startsWith('+');
  return (
    <span className="row" style={{ gap: 1, color: up ? 'var(--lime)' : 'var(--coral)', fontSize: 11.5, fontWeight: 800, width: 26, justifyContent: 'center' }}>
      <Icon name="arrowup" size={12} style={{ transform: up ? 'none' : 'rotate(180deg)' }} />{String(t).replace(/[+-]/, '')}
    </span>
  );
}

Object.assign(window, { ScreenRanking });
