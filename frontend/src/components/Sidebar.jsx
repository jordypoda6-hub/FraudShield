import React from 'react'

const ICONS = {
  dashboard: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  history: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"/><polyline points="12,7 12,12 15,15"/>
    </svg>
  ),
  analytics: (
    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
    </svg>
  ),
  shield: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span style={{ opacity: active ? 1 : 0.6 }}>{icon}</span>
      <span style={{ flex:1 }}>{label}</span>
      {badge != null && (
        <span style={{
          background: 'var(--red-dim)', color: 'var(--red)',
          border: '1px solid var(--red-b)',
          borderRadius: '99px', fontSize: '10px', padding: '1px 6px', fontWeight: 500,
        }}>{badge}</span>
      )}
    </div>
  )
}

export default function Sidebar({ activeTab, setActiveTab, stats, speed, setSpeed, running, toggle }) {
  const fraudRate = stats.total > 0 ? ((stats.frauds / stats.total)*100).toFixed(2) : '0.00'

  return (
    <aside style={{
      width: '228px', minWidth: '228px',
      background: 'var(--s1)',
      borderRight: '1px solid var(--b1)',
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      padding: '0',
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--b1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'6px' }}>
          <div style={{
            width:'32px', height:'32px', borderRadius:'8px',
            background: 'linear-gradient(135deg,#3B5BDB,#5B8EF0)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'white',
          }}>
            {ICONS.shield}
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:'14px', color:'var(--t1)', letterSpacing:'-0.01em' }}>FraudShield</div>
            <div style={{ fontSize:'10px', color:'var(--t3)' }}>Projet F2 · 2iE</div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{
          width:'34px', height:'34px', borderRadius:'50%',
          background:'linear-gradient(135deg,#1D4ED8,#3B82F6)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:600, fontSize:'13px', color:'white', flexShrink:0,
        }}>
          A
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:'13px', fontWeight:500, color:'var(--t1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            Analyste — 2iE
          </div>
          <div style={{ fontSize:'11px', color:'var(--t3)' }}>RF · AUC-PR 0.8207</div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding:'12px 10px', borderBottom:'1px solid var(--b1)' }}>
        <div style={{ fontSize:'10px', color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.08em', padding:'0 8px', marginBottom:'6px' }}>
          Navigation
        </div>
        <NavItem icon={ICONS.dashboard}  label="Dashboard"   active={activeTab==='dashboard'}  onClick={()=>setActiveTab('dashboard')} />
        <NavItem icon={ICONS.history}    label="Historique"  active={activeTab==='history'}    onClick={()=>setActiveTab('history')}   badge={stats.total} />
        <NavItem icon={ICONS.analytics}  label="Analytique"  active={activeTab==='analytics'}  onClick={()=>setActiveTab('analytics')} />
      </div>

      {/* Live stats */}
      <div style={{ padding:'14px 18px', flex:1, overflowY:'auto' }}>
        <div style={{ fontSize:'10px', color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>
          Statistiques
        </div>
        {[
          { label:'Transactions',  val: stats.total.toLocaleString('fr-FR'), color:'var(--t1)' },
          { label:'Fraudes',       val: stats.frauds,    color:'var(--red)' },
          { label:'Suspects',      val: stats.suspects,  color:'var(--amber)' },
          { label:'Normales',      val: stats.normal,    color:'var(--green)' },
          { label:'Taux fraude',   val: fraudRate+'%',   color:'var(--red)' },
          { label:'Montant sauvé', val: stats.saved.toLocaleString('fr-FR')+'€', color:'var(--green)' },
        ].map(s=>(
          <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <span style={{ fontSize:'12px', color:'var(--t2)' }}>{s.label}</span>
            <span style={{ fontSize:'13px', fontWeight:500, color:s.color, fontFamily:'var(--mono)' }}>{s.val}</span>
          </div>
        ))}

        {/* Model info */}
        <div style={{ marginTop:'16px', paddingTop:'14px', borderTop:'1px solid var(--b1)' }}>
          <div style={{ fontSize:'10px', color:'var(--t4)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px' }}>
            Modèle · Random Forest
          </div>
          {[['AUC-PR','0.8207'],['Seuil','0.059'],['Précision','98.21%'],['Rappel','77.33%'],['F1','86.57%']].map(([k,v])=>(
            <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'11px', color:'var(--t3)' }}>{k}</span>
              <span style={{ fontSize:'11px', color:'var(--t2)', fontFamily:'var(--mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding:'12px 14px', borderTop:'1px solid var(--b1)' }}>
        <div style={{ display:'flex', gap:'4px', marginBottom:'8px' }}>
          {['slow','normal','fast'].map(s=>(
            <button key={s} onClick={()=>setSpeed(s)} style={{
              flex:1, padding:'5px 0', fontSize:'10px', borderRadius:'5px', cursor:'pointer',
              border:'1px solid',
              borderColor: speed===s ? 'var(--blue)' : 'var(--b2)',
              background:  speed===s ? 'var(--blue-dim)' : 'transparent',
              color:       speed===s ? 'var(--blue)' : 'var(--t3)',
              fontFamily: 'var(--font)', fontWeight: speed===s?500:400,
            }}>
              {s==='slow'?'Lente':s==='normal'?'Normal':'Rapide'}
            </button>
          ))}
        </div>
        <button onClick={toggle} style={{
          width:'100%', padding:'8px', borderRadius:'6px', cursor:'pointer',
          border:'1px solid', fontFamily:'var(--font)',
          borderColor: running?'var(--red-b)':'var(--green-b)',
          background:  running?'var(--red-dim)':'var(--green-dim)',
          color:       running?'var(--red)':'var(--green)',
          fontSize:'12px', fontWeight:500,
        }}>
          {running?'⏸  Mettre en pause':'▶  Reprendre'}
        </button>
      </div>
    </aside>
  )
}
