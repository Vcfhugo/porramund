/* ============================================================
   PANEL DE ADMINISTRACIÓN — Resultados del Mundial
   Solo accesible al creador de la porra (isAdmin)
   ============================================================ */
const ADMIN_INPUT_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--line-2)',
  borderRadius: 8,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 700,
  padding: '7px 10px',
  outline: 'none',
};

const ADMIN_SELECT_STYLE = {
  background: 'var(--surface-2)',
  border: '1px solid var(--line-2)',
  borderRadius: 8,
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 12,
  fontWeight: 700,
  padding: '6px 10px',
  outline: 'none',
  cursor: 'pointer',
  width: '100%',
};

const ROUNDS     = ['group','r32','r16','qf','sf','final'];
const ROUND_LBL  = { group:'Grupos', r32:'R32', r16:'Octavos', qf:'Cuartos', sf:'Semis', final:'Final' };
const STATUS_COL = { upcoming:'var(--muted)', live:'var(--coral)', finished:'var(--lime)' };

function ScreenAdmin({ onClose, porraId }) {
  const DB = window.DB;
  const [adminTab,    setAdminTab]    = useState('partidos');
  const [filterRound, setFilterRound] = useState('group');
  const [matches,     setMatches]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(null);
  const [showAdd,     setShowAdd]     = useState(false);
  const [edits,       setEdits]       = useState({});
  const [toast,       setToast]       = useState(null);
  const [syncing,     setSyncing]     = useState(false);

  const EMPTY_NEW = { home:'', away:'', group_code:'', round:'group', match_date:'', home_score:'', away_score:'', status:'upcoming' };
  const [newM, setNewM] = useState(EMPTY_NEW);

  /* helpers */
  const setEdit   = (id, f, v) => setEdits(p => ({ ...p, [id]: { ...(p[id]||{}), [f]: v } }));
  const getEdit   = (m, f)     => (edits[m.id]?.[f] !== undefined ? edits[m.id][f] : (m[f] ?? ''));
  const setNewFld = (f, v)     => setNewM(p => ({...p, [f]: v}));

  const showToast = (msg, ok=true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  async function triggerSync() {
    if (!window.SB) return;
    setSyncing(true);
    try {
      const result = await window.SB.syncMatches();
      showToast(`✓ Sync OK · ${result.synced ?? 0} partidos`);
      await loadMatches();
    } catch(e) {
      showToast('Error sync: ' + e.message, false);
    }
    setSyncing(false);
  }

  /* ---- cargar partidos ---- */
  async function loadMatches() {
    setLoading(true);
    try {
      if (window.SB) {
        const data = await window.SB.getMatches();
        setMatches(data);
        const init = {};
        data.forEach(m => {
          init[m.id] = {
            home_score: m.home_score ?? '',
            away_score: m.away_score ?? '',
            status:     m.status || 'upcoming',
            home_rank:  m.home_rank ?? '',
            away_rank:  m.away_rank ?? '',
          };
        });
        setEdits(init);
      }
    } catch(e) { showToast('Error cargando: ' + e.message, false); }
    setLoading(false);
  }

  useEffect(() => { loadMatches(); }, []);

  /* ---- guardar un partido ---- */
  async function saveMatch(m) {
    if (!window.sb) return;
    setSaving(m.id);
    const e = edits[m.id] || {};
    const parseNum = v => (v !== '' && v !== null && v !== undefined) ? parseInt(v) : null;
    try {
      const { error } = await window.sb.from('wc_matches').upsert({
        id:         m.id,
        home_score: parseNum(e.home_score),
        away_score: parseNum(e.away_score),
        status:     e.status || 'upcoming',
        home_rank:  parseNum(e.home_rank),
        away_rank:  parseNum(e.away_rank),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw error;
      showToast('✓ Guardado');
      await loadMatches();
    } catch(err) { showToast('Error: ' + err.message, false); }
    setSaving(null);
  }

  /* ---- añadir nuevo partido ---- */
  async function addMatch() {
    if (!window.sb || !newM.home || !newM.away) {
      showToast('Falta local o visitante', false); return;
    }
    setSaving('new');
    const slug = `m_${newM.round}_${newM.home}_${newM.away}`;
    const id = `${slug}_${Date.now()}`;
    try {
      const parseNum = v => (v !== '') ? parseInt(v) : null;
      const { error } = await window.sb.from('wc_matches').insert({
        id,
        home:       newM.home.toLowerCase().trim(),
        away:       newM.away.toLowerCase().trim(),
        group_code: newM.group_code?.toUpperCase() || null,
        round:      newM.round,
        match_date: newM.match_date ? new Date(newM.match_date).toISOString() : null,
        home_score: parseNum(newM.home_score),
        away_score: parseNum(newM.away_score),
        status:     newM.status,
      });
      if (error) throw error;
      showToast('✓ Partido añadido');
      setNewM(EMPTY_NEW);
      setShowAdd(false);
      await loadMatches();
    } catch(err) { showToast('Error: ' + err.message, false); }
    setSaving(null);
  }

  const filtered = matches.filter(m => m.round === filterRound);

  return (
    <div style={{
      position:'absolute', inset:0, zIndex:200,
      background:'var(--bg)', display:'flex', flexDirection:'column',
    }}>
      <div className="safe-top" />

      {/* appbar */}
      <div className="appbar">
        <button className="icon-btn" onClick={onClose}>
          <Icon name="chevron" size={20} style={{ transform:'rotate(180deg)' }} />
        </button>
        <div className="col" style={{ gap:1, flex:1, marginLeft:4 }}>
          <span className="greet">Solo organizador ⚙️</span>
          <span className="title">{adminTab === 'partidos' ? 'Resultados' : 'Miembros'}</span>
        </div>
        {adminTab === 'partidos' && <>
          <button className="icon-btn" onClick={loadMatches} title="Recargar">
            <span style={{ fontSize:16 }}>↻</span>
          </button>
          <button
            onClick={triggerSync}
            disabled={syncing}
            style={{
              marginLeft:6, height:34, padding:'0 12px',
              background: syncing ? 'var(--surface-2)' : 'var(--lime)',
              color: syncing ? 'var(--muted)' : 'var(--accent-ink)',
              border:'none', borderRadius:10, fontWeight:800, fontSize:12,
              cursor: syncing ? 'default' : 'pointer', fontFamily:'inherit',
            }}>
            {syncing ? '…' : '⚡ Sync'}
          </button>
        </>}
      </div>

      {/* top tabs */}
      <div className="chips no-sb" style={{ gap:8, padding:'6px 16px', borderBottom:'1px solid var(--line)' }}>
        {[['partidos','Resultados'],['miembros','Miembros']].map(([k,l]) => (
          <button key={k} className={'chip'+(adminTab===k?' on':'')} onClick={() => setAdminTab(k)}>
            {l}
          </button>
        ))}
      </div>

      {adminTab === 'miembros' ? (
        <AdminMembersTab porraId={porraId} showToast={showToast} />
      ) : (
        <>
          {/* banner auto-sync */}
          <div style={{
            margin:'8px 14px 0', padding:'9px 13px',
            background:'rgba(171,203,45,.10)', border:'1px solid rgba(171,203,45,.25)',
            borderRadius:10, display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🤖</span>
            <div>
              <p style={{ margin:0, fontSize:12, fontWeight:800, color:'var(--lime)' }}>
                Sync automático cada 5 min
              </p>
              <p style={{ margin:0, fontSize:11, fontWeight:600, color:'var(--muted)', lineHeight:1.4 }}>
                Los resultados se actualizan solos desde football-data.org.
                Usa este panel solo para corregir datos incorrectos.
              </p>
            </div>
          </div>

          {/* round filter */}
          <div className="chips no-sb" style={{ gap:8, padding:'6px 16px' }}>
            {ROUNDS.map(r => (
              <button key={r} className={'chip'+(filterRound===r?' on':'')} onClick={() => setFilterRound(r)}>
                {ROUND_LBL[r]}
              </button>
            ))}
          </div>

          {/* counters */}
          {!loading && (
            <div className="row" style={{ padding:'4px 18px 0', gap:14 }}>
              {(['upcoming','live','finished']).map(s => {
                const n = filtered.filter(m => m.status===s).length;
                return (
                  <span key={s} style={{ fontSize:11, fontWeight:700, color: STATUS_COL[s] }}>
                    {n} {s==='upcoming'?'pendientes':s==='live'?'en vivo':'terminados'}
                  </span>
                );
              })}
            </div>
          )}

          {/* lista */}
          <div className="scroll no-sb" style={{ flex:1, paddingTop:8 }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)', fontWeight:700 }}>
                Cargando partidos...
              </div>
            ) : (
              <>
                <div style={{ padding:'0 14px', display:'flex', flexDirection:'column', gap:10 }}>
                  {filtered.length === 0 && (
                    <div style={{ textAlign:'center', padding:'30px 0', color:'var(--muted)', fontWeight:700 }}>
                      No hay partidos en esta ronda todavía
                    </div>
                  )}
                  {filtered.map(m => <AdminMatchRow key={m.id} m={m}
                    getEdit={getEdit} setEdit={setEdit}
                    saving={saving} onSave={saveMatch}
                    DB={DB} />)}
                </div>
                <div style={{ padding:'12px 14px 0' }}>
                  {!showAdd ? (
                    <button className="btn btn-ghost" onClick={() => setShowAdd(true)}>
                      <Icon name="plus" size={18} /> Añadir partido
                    </button>
                  ) : (
                    <AdminAddForm
                      newM={newM} setNewFld={setNewFld}
                      saving={saving==='new'}
                      onAdd={addMatch}
                      onCancel={() => { setShowAdd(false); setNewM(EMPTY_NEW); }}
                      DB={DB}
                    />
                  )}
                </div>
              </>
            )}
            <div style={{ height:32 }} />
          </div>
        </>
      )}

      {/* toast */}
      {toast && (
        <div style={{
          position:'absolute', bottom:28, left:'50%', transform:'translateX(-50%)',
          background: toast.ok ? 'var(--lime)' : 'var(--coral)',
          color: toast.ok ? 'var(--accent-ink)' : '#fff',
          fontWeight:800, fontSize:13, borderRadius:12, padding:'9px 18px',
          boxShadow:'0 4px 16px rgba(0,0,0,.4)', whiteSpace:'nowrap',
          pointerEvents:'none',
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ---- Fila de partido editable ---- */
function AdminMatchRow({ m, getEdit, setEdit, saving, onSave, DB }) {
  const isSaving = saving === m.id;
  const ht = DB.T[m.home];
  const at = DB.T[m.away];
  const status = getEdit(m, 'status') || 'upcoming';

  return (
    <div className="card" style={{ padding:'11px 13px' }}>
      {/* meta */}
      <div className="row" style={{ marginBottom:8, justifyContent:'space-between' }}>
        <span className="mut" style={{ fontSize:10, fontWeight:700, fontFamily:"'Brasil2014Numeros',monospace" }}>
          {m.group_code ? `GRP ${m.group_code} · ` : ''}{m.id.length > 20 ? m.id.slice(0,20)+'…' : m.id}
        </span>
        {m.match_date && (
          <span className="mut" style={{ fontSize:10.5, fontWeight:700 }}>
            {new Date(m.match_date).toLocaleDateString('es',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
          </span>
        )}
      </div>

      <div className="row" style={{ alignItems:'center', gap:8 }}>
        {/* local */}
        <div className="col" style={{ flex:1, gap:5, alignItems:'flex-start' }}>
          <div className="row gap6">
            {ht ? <Flag team={m.home} size={24} /> : <span>🏳️</span>}
            <span style={{ fontWeight:800, fontSize:13.5 }}>{ht?.code || m.home.toUpperCase()}</span>
          </div>
          {m.round === 'group' && (
            <div className="row gap5" style={{ alignItems:'center' }}>
              <span className="mut" style={{ fontSize:10, fontWeight:700 }}>Pos:</span>
              <input type="number" min="1" max="4"
                value={getEdit(m,'home_rank')}
                onChange={e => setEdit(m.id, 'home_rank', e.target.value)}
                style={{ ...ADMIN_INPUT_STYLE, width:42, fontSize:13, textAlign:'center', padding:'4px 6px' }}
                placeholder="–" />
            </div>
          )}
        </div>

        {/* marcador */}
        <div className="col" style={{ alignItems:'center', gap:6 }}>
          <div className="row" style={{ alignItems:'center', gap:6 }}>
            <input type="number" min="0" max="30"
              value={getEdit(m,'home_score')}
              onChange={e => setEdit(m.id, 'home_score', e.target.value)}
              style={{ ...ADMIN_INPUT_STYLE, width:48, fontSize:22, fontWeight:900, textAlign:'center', padding:'4px 4px' }}
              placeholder="–" />
            <span style={{ fontWeight:700, color:'var(--muted)', fontSize:20 }}>:</span>
            <input type="number" min="0" max="30"
              value={getEdit(m,'away_score')}
              onChange={e => setEdit(m.id, 'away_score', e.target.value)}
              style={{ ...ADMIN_INPUT_STYLE, width:48, fontSize:22, fontWeight:900, textAlign:'center', padding:'4px 4px' }}
              placeholder="–" />
          </div>
          <select
            value={status}
            onChange={e => setEdit(m.id, 'status', e.target.value)}
            style={{ ...ADMIN_SELECT_STYLE, width:'auto', fontSize:11, color: STATUS_COL[status] || 'var(--muted)' }}>
            <option value="upcoming">Pendiente</option>
            <option value="live">En vivo</option>
            <option value="finished">Terminado</option>
          </select>
        </div>

        {/* visitante */}
        <div className="col" style={{ flex:1, gap:5, alignItems:'flex-end' }}>
          <div className="row gap6">
            <span style={{ fontWeight:800, fontSize:13.5 }}>{at?.code || m.away.toUpperCase()}</span>
            {at ? <Flag team={m.away} size={24} /> : <span>🏳️</span>}
          </div>
          {m.round === 'group' && (
            <div className="row gap5" style={{ alignItems:'center' }}>
              <span className="mut" style={{ fontSize:10, fontWeight:700 }}>Pos:</span>
              <input type="number" min="1" max="4"
                value={getEdit(m,'away_rank')}
                onChange={e => setEdit(m.id, 'away_rank', e.target.value)}
                style={{ ...ADMIN_INPUT_STYLE, width:42, fontSize:13, textAlign:'center', padding:'4px 6px' }}
                placeholder="–" />
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => onSave(m)}
        disabled={isSaving}
        style={{
          width:'100%', marginTop:10, height:38,
          background: isSaving ? 'var(--surface-2)' : 'var(--lime)',
          color: isSaving ? 'var(--muted)' : 'var(--accent-ink)',
          border:'none', borderRadius:10, fontWeight:800,
          fontSize:13, cursor: isSaving ? 'default' : 'pointer',
          fontFamily:'inherit', transition:'background .15s',
        }}>
        {isSaving ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}

/* ---- Formulario para añadir partido ---- */
function AdminAddForm({ newM, setNewFld, saving, onAdd, onCancel, DB }) {
  const allTeams = Object.entries(DB.T).sort((a,b) => a[1].name.localeCompare(b[1].name));
  const TeamSelect = ({ field }) => (
    <select value={newM[field]} onChange={e => setNewFld(field, e.target.value)}
      style={{ ...ADMIN_SELECT_STYLE }}>
      <option value="">— Equipo —</option>
      {allTeams.map(([id, t]) => <option key={id} value={id}>{t.code} · {t.name}</option>)}
    </select>
  );

  return (
    <div className="card" style={{ padding:'14px' }}>
      <span style={{ fontWeight:800, fontSize:14, display:'block', marginBottom:12 }}>Nuevo partido</span>
      <div className="col" style={{ gap:10 }}>
        <div className="row gap8">
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Local</span>
            <TeamSelect field="home" />
          </div>
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Visitante</span>
            <TeamSelect field="away" />
          </div>
        </div>
        <div className="row gap8">
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Ronda</span>
            <select value={newM.round} onChange={e => setNewFld('round', e.target.value)} style={ADMIN_SELECT_STYLE}>
              {ROUNDS.map(r => <option key={r} value={r}>{ROUND_LBL[r]}</option>)}
            </select>
          </div>
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Grupo WC</span>
            <input value={newM.group_code}
              onChange={e => setNewFld('group_code', e.target.value)}
              placeholder="A – P" maxLength={2}
              style={{ ...ADMIN_INPUT_STYLE, fontSize:13 }} />
          </div>
        </div>
        <div className="col" style={{ gap:4 }}>
          <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Fecha y hora</span>
          <input type="datetime-local" value={newM.match_date}
            onChange={e => setNewFld('match_date', e.target.value)}
            style={{ ...ADMIN_INPUT_STYLE, width:'100%', boxSizing:'border-box' }} />
        </div>
        <div className="row gap8">
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Goles local</span>
            <input type="number" min="0" value={newM.home_score}
              onChange={e => setNewFld('home_score', e.target.value)}
              placeholder="–" style={{ ...ADMIN_INPUT_STYLE, fontSize:13 }} />
          </div>
          <div className="col" style={{ flex:1, gap:4 }}>
            <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Goles visitante</span>
            <input type="number" min="0" value={newM.away_score}
              onChange={e => setNewFld('away_score', e.target.value)}
              placeholder="–" style={{ ...ADMIN_INPUT_STYLE, fontSize:13 }} />
          </div>
        </div>
        <div className="col" style={{ gap:4 }}>
          <span className="mut" style={{ fontSize:11, fontWeight:700 }}>Estado</span>
          <select value={newM.status} onChange={e => setNewFld('status', e.target.value)} style={ADMIN_SELECT_STYLE}>
            <option value="upcoming">Pendiente</option>
            <option value="live">En vivo</option>
            <option value="finished">Terminado</option>
          </select>
        </div>
        <div className="row gap8" style={{ marginTop:4 }}>
          <button className="btn btn-ghost" style={{ flex:1, height:44 }} onClick={onCancel}>
            Cancelar
          </button>
          <button disabled={saving} onClick={onAdd} style={{
            flex:2, height:44, background:'var(--lime)', color:'var(--accent-ink)',
            border:'none', borderRadius:12, fontWeight:800, fontSize:14,
            cursor: saving ? 'default' : 'pointer', fontFamily:'inherit',
          }}>
            {saving ? 'Añadiendo…' : 'Añadir partido'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Tab de miembros ---- */
function AdminMembersTab({ porraId, showToast }) {
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [kicking,    setKicking]    = useState(null);
  const [confirmKick,setConfirmKick]= useState(null); // userId a expulsar

  const load = async () => {
    setLoading(true);
    try {
      if (window.SB && porraId) {
        const data = await window.SB.getMembers(porraId);
        setMembers(data);
      }
    } catch(e) { showToast('Error cargando miembros: ' + e.message, false); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [porraId]);

  const kick = async (userId, name) => {
    setKicking(userId);
    try {
      await window.SB.kickMember(porraId, userId);
      showToast(`✓ ${name} expulsado`);
      setMembers(m => m.filter(x => x.user_id !== userId));
    } catch(e) { showToast('Error: ' + e.message, false); }
    setKicking(null);
    setConfirmKick(null);
  };

  const getMemberStatus = (m) => {
    if (!m.picks) return { label:'Sin selección', col:'var(--muted)' };
    if (m.picks.locked) return { label:'Confirmado ✓', col:'var(--lime)' };
    const picks = m.picks.data || {};
    const n = [1,2,3,4,5,6].reduce((s,id) =>
      s + (id === 5 ? (picks.g5 ? 1 : 0) : (picks['g'+id] || []).length), 0);
    if (n === 0) return { label:'Sin selección', col:'var(--muted)' };
    if (n < 11) return { label:`Incompleto (${n}/11)`, col:'var(--orange)' };
    return { label:'Completo (sin confirmar)', col:'var(--gold)' };
  };

  if (loading) {
    return (
      <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted)', fontWeight:700 }}>
        Cargando miembros...
      </div>
    );
  }

  if (!porraId || !window.SB) {
    return (
      <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--muted)' }}>
        <p style={{ fontWeight:700, fontSize:14, margin:0 }}>No disponible en modo demo</p>
        <p style={{ fontWeight:600, fontSize:12, margin:'6px 0 0' }}>Configura Supabase para gestionar miembros</p>
      </div>
    );
  }

  return (
    <div className="scroll no-sb" style={{ flex:1 }}>
      <div style={{ padding:'10px 14px 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontWeight:800, fontSize:13 }}>{members.length} jugadores</span>
        <button className="icon-btn" onClick={load} title="Recargar">
          <span style={{ fontSize:15 }}>↻</span>
        </button>
      </div>

      <div style={{ padding:'8px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {members.map(m => {
          const st = getMemberStatus(m);
          const isKicking = kicking === m.user_id;
          return (
            <div key={m.user_id} className="card" style={{ padding:'11px 13px' }}>
              <div className="row" style={{ alignItems:'center', gap:10 }}>
                <div style={{
                  width:36, height:36, borderRadius:'50%', flexShrink:0,
                  background:'var(--surface-3)', display:'flex', alignItems:'center',
                  justifyContent:'center', fontWeight:900, fontSize:14, color:'var(--muted)',
                }}>
                  {(m.display_name?.[0] || '?').toUpperCase()}
                </div>
                <div className="col" style={{ flex:1, gap:2 }}>
                  <span style={{ fontWeight:800, fontSize:13.5 }}>
                    {m.display_name}{m.isMe ? ' (yo)' : ''}
                  </span>
                  <span style={{ fontSize:11, fontWeight:700, color: st.col }}>{st.label}</span>
                </div>
                {!m.isMe && (
                  confirmKick === m.user_id ? (
                    <div className="row gap6">
                      <button onClick={() => setConfirmKick(null)}
                        style={{ fontSize:11, fontWeight:800, color:'var(--muted)',
                          background:'var(--surface-3)', border:'none', borderRadius:7,
                          padding:'6px 10px', cursor:'pointer', fontFamily:'inherit' }}>
                        No
                      </button>
                      <button onClick={() => kick(m.user_id, m.display_name)} disabled={isKicking}
                        style={{ fontSize:11, fontWeight:800, color:'#fff',
                          background:'var(--coral)', border:'none', borderRadius:7,
                          padding:'6px 10px', cursor: isKicking ? 'default' : 'pointer',
                          fontFamily:'inherit', opacity: isKicking ? .6 : 1 }}>
                        {isKicking ? '…' : 'Expulsar'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmKick(m.user_id)}
                      style={{ fontSize:11, fontWeight:800, color:'var(--coral)',
                        background:'rgba(216,19,26,.12)', border:'1px solid rgba(216,19,26,.2)',
                        borderRadius:7, padding:'6px 10px', cursor:'pointer', fontFamily:'inherit' }}>
                      Expulsar
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height:32 }} />
    </div>
  );
}

Object.assign(window, { ScreenAdmin });
