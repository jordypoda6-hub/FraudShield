import React from 'react'
import ConnectionBadge from './ConnectionBadge'

export default function TopBar({ stats, running, activeTab, apiStatus }) {
  const titles = { dashboard:'Vue temps réel', history:'Historique complet', analytics:'Analyse & Métriques' }

  return (
    <header style={{
      height:'54px', background:'var(--s1)',
      borderBottom:'1px solid var(--b1)',
      display:'flex', alignItems:'center',
      padding:'0 20px', gap:'14px',
      position:'sticky', top:0, zIndex:50,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }}>
        <span style={{ fontSize:'15px', fontWeight:600, color:'var(--t1)', letterSpacing:'-0.01em' }}>
          {titles[activeTab]}
        </span>
        {running && activeTab === 'dashboard' && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <div className="dot-live"/>
            <span style={{ fontSize:'11px', color:'var(--green)', fontWeight:500, letterSpacing:'0.04em' }}>
              EN DIRECT
            </span>
          </div>
        )}
        <ConnectionBadge status={apiStatus} />
      </div>

      <div style={{ display:'flex', gap:'2px' }}>
        {[
          { label:'Analysées',    value: stats.total.toLocaleString('fr-FR'), color:'var(--t1)' },
          { label:'Fraudes',      value: stats.frauds,                         color:'var(--red)' },
          { label:'Montant sauvé',value: stats.saved.toLocaleString('fr-FR')+'€', color:'var(--green)' },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'right', padding:'0 14px', borderLeft:'1px solid var(--b1)' }}>
            <div style={{ fontSize:'10px', color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize:'16px', fontWeight:600, color:s.color, fontFamily:'var(--mono)', lineHeight:1.3 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}
