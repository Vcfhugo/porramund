/* ============================================================
   Pantalla PERFIL + insignias/logros + mis ligas
   ============================================================ */
function ScreenProfile({ openLeagues, openRules, openDraft, openAdmin, user, userName, userInitials, currentPorra, isAdmin, onLogout }) {
  const DB = window.DB;
  const displayName = userName || 'Jugador';
  const initials    = userInitials || displayName.slice(0, 2).toUpperCase();
  const email       = user?.email || '';

  /* Porra activa para mostrar en perfil */
  const porras = currentPorra
    ? [{ id: currentPorra.id, name: currentPorra.name,
        members: currentPorra.memberCount ?? '?',
        pot: currentPorra.price
          ? `${(currentPorra.price || 10) * (currentPorra.memberCount || 1)} €`
          : '?',
        code: currentPorra.code || '',
        color: '#D8131A', me: '?º' }]
    : DB.leagues;  /* fallback mock en demo */

  const badgeIc = { target:'target', fire:'fire', clock:'clock', medal:'medal', crown:'crown', shield:'shield' };

  return (
    <div className="scroll no-sb">
      <div className="safe-top" />
      <div className="appbar">
        <div className="col" style={{ gap: 1 }}>
          <span className="greet">{email || 'Perfil'}</span>
          <span className="title">Mi perfil</span>
        </div>
        <div className="spacer" />
        {onLogout && (
          <button className="icon-btn" onClick={onLogout} title="Cerrar sesión">
            <Icon name="share" size={20} style={{ transform:'rotate(180deg)' }} />
          </button>
        )}
      </div>

      <BrasilBand />

      {/* identidad */}
      <div style={{ padding: '0 20px' }}>
        <div className="card pad" style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ position:'relative' }}>
            <Av txt={initials} col="linear-gradient(135deg,#8C6BFF,#27E5D4)" size={68} r={20} />
          </div>
          <div className="col" style={{ flex:1, gap:3 }}>
            <span style={{ fontWeight:900, fontSize:20, letterSpacing:'-.02em' }}>{displayName}</span>
            {email && <span className="mut" style={{ fontSize:12, fontWeight:600 }}>{email}</span>}
            {isAdmin && (
              <div className="row gap6" style={{ marginTop:4 }}>
                <span className="tag tag-pts"><Icon name="settings" size={11} /> Organizador</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* mis porras */}
      <SecHead title="Mis porras" action="Nueva" onAction={openDraft} />
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {porras.map(l => (
          <div key={l.id || l.code} className="card" style={{ cursor:'default' }}>
            <div className="pad row" style={{ gap:13, padding:14 }}>
              <div style={{ width:44, height:44, borderRadius:13, background:l.color||'#D8131A',
                display:'flex', alignItems:'center', justifyContent:'center', flex:'none' }}>
                <Icon name="users" size={22} style={{ color:'#0a0e18' }} />
              </div>
              <div className="col" style={{ flex:1, gap:2 }}>
                <span style={{ fontWeight:800, fontSize:14.5 }}>{l.name}</span>
                <span className="mut" style={{ fontSize:12, fontWeight:600 }}>
                  {typeof l.members === 'number' ? `${l.members} jugadores · ` : ''}Bote {l.pot}
                </span>
                {l.code && (
                  <span className="mut" style={{ fontSize:11, fontWeight:700, fontFamily:"'Brasil2014Numeros',monospace",
                    letterSpacing:'.1em', color:'var(--muted-2)' }}>#{l.code}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* logros */}
      <WaveBand color="var(--gold)" height={12} opacity={0.40} thick={2} />
      <SecHead title="Insignias" action={`${DB.badges.filter(b=>b.got).length} de ${DB.badges.length}`} />
      <div style={{ padding:'0 20px' }}>
        <div style={{ position:'relative', padding:'14px', borderRadius:16,
          background:'var(--surface)', border:'1px solid var(--line-2)',
          boxShadow:'0 2px 12px rgba(0,52,105,.06)' }}>
          {/* DotRhythm de fondo — rellena el vacío entre badges */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', borderRadius:16, opacity:0.6 }}>
            <DotRhythm cols={12} rows={6} dotSize={3} gap={10}
              colors={['#336F1B','#FDD301','#ABCB2D']} opacity={0.14} />
          </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, position:'relative' }}>
          {DB.badges.map(b => (
            <div key={b.id} className={'badge'+(b.got?'':' locked')}>
              <div className="bi" style={{ background:b.got?b.col:'var(--surface-3)', color:b.got?'#0a0e18':'var(--muted-2)' }}>
                {b.got ? <Icon name={badgeIc[b.ic]} size={22} /> : <Icon name="lock" size={20} />}
              </div>
              <span className="bn">{b.name}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div style={{ padding:'20px' }}>
        {isAdmin && openAdmin && (
          <button className="btn btn-accent" style={{ marginBottom:10 }} onClick={openAdmin}>
            <Icon name="settings" size={18} /> Panel de resultados
          </button>
        )}
        {isAdmin && (
          <button className="btn btn-ghost" style={{ marginBottom:10 }} onClick={openDraft}>
            <Icon name="plus" size={19} /> Crear nueva partida
          </button>
        )}
        <button className="btn btn-ghost" style={{ marginBottom:10 }} onClick={openRules}>
          <Icon name="lock" size={19} /> Reglamento oficial
        </button>
        {onLogout && (
          <button className="btn btn-ghost" onClick={onLogout}>
            <Icon name="share" size={19} style={{ transform:'rotate(180deg)' }} /> Cerrar sesión
          </button>
        )}
      </div>
      <div style={{ height:8 }} />
    </div>
  );
}

Object.assign(window, { ScreenProfile });
