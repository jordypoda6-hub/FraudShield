import React, { useMemo } from 'react'
import { VERDICT_CFG } from '../utils/engine'

function SHAPMini({ shapData, verdict }) {
  const cfg = VERDICT_CFG[verdict]
  const top3 = shapData.filter(d => d.contrib > 0).slice(0, 3)
  const maxC  = Math.max(...top3.map(d => d.contrib), 0.01)

  if (top3.length === 0) return (
    <div style={{ fontSize:'11px',color:'var(--t4)' }}>Aucune anomalie détectée</div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'4px' }}>
      <div style={{ fontSize:'10px',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'2px' }}>
        Facteurs SHAP principaux
      </div>
      {top3.map((d, i) => (
        <div key={d.feat} style={{ display:'flex',alignItems:'center',gap:'6px' }}>
          <span style={{ fontSize:'11px',color:'var(--t3)',fontFamily:'var(--mono)',width:'28px' }}>{d.feat}</span>
          <div style={{ flex:1,height:'4px',background:'var(--s1)',borderRadius:'2px' }}>
            <div style={{
              width:`${(d.contrib/maxC)*100}%`,height:'100%',
              background:cfg.color,borderRadius:'2px',opacity:0.8,
            }}/>
          </div>
          <span style={{ fontSize:'10px',color:cfg.color,fontFamily:'var(--mono)',minWidth:'36px',textAlign:'right' }}>
            +{d.contrib.toFixed(2)}
          </span>
          <span style={{ fontSize:'10px',color:'var(--t4)',fontFamily:'var(--mono)',minWidth:'48px',textAlign:'right' }}>
            ({d.val>0?'+':''}{d.val.toFixed(2)})
          </span>
        </div>
      ))}
    </div>
  )
}

function AlertCard({ row, isNew, onClick }) {
  const cfg = VERDICT_CFG[row.vd]
  return (
    <div
      className={isNew?'anim-fade':''}
      onClick={() => onClick(row)}
      style={{
        background:'var(--s2)',border:`1px solid ${cfg.border}`,
        borderLeft:`3px solid ${cfg.color}`,borderRadius:'8px',padding:'13px 14px',
        cursor:'pointer',transition:'background 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--s3)'}
      onMouseLeave={e => e.currentTarget.style.background='var(--s2)'}
    >
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px' }}>
        <span className={`chip ${cfg.chip}`}>{cfg.label}</span>
        <span style={{ fontSize:'11px',color:'var(--t3)',fontFamily:'var(--mono)' }}>
          #{String(row.tx.id).padStart(4,'0')}
        </span>
      </div>

      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:'8px' }}>
        <span style={{ fontSize:'19px',fontWeight:700,color:'var(--t1)',fontFamily:'var(--mono)',lineHeight:1 }}>
          {row.tx.amount.toFixed(2)} €
        </span>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:'18px',fontWeight:700,color:cfg.color,fontFamily:'var(--mono)',lineHeight:1 }}>{row.sc}</div>
          <div style={{ fontSize:'10px',color:'var(--t3)' }}>/ 100</div>
        </div>
      </div>

      <div style={{ height:'3px',background:'var(--s1)',borderRadius:'2px',marginBottom:'10px' }}>
        <div style={{ width:`${row.sc}%`,height:'100%',background:cfg.color,borderRadius:'2px' }}/>
      </div>

      <SHAPMini shapData={row.shapData} verdict={row.vd} />

      <div style={{ marginTop:'8px',fontSize:'10px',color:'var(--t4)' }}>
        {row.tx.timeLabel} · Cliquer → détails SHAP complets
      </div>
    </div>
  )
}

export default function ResultPanel({ feed, onSelect }) {
  const alerts = useMemo(() =>
    feed.filter(r => r.vd==='fraud'||r.vd==='suspect').slice(0,25),
    [feed]
  )
  const fraudCount   = alerts.filter(a=>a.vd==='fraud').length
  const suspectCount = alerts.filter(a=>a.vd==='suspect').length

  return (
    <div className="card" style={{ width:'290px',minWidth:'290px',display:'flex',flexDirection:'column',minHeight:0 }}>
      <div style={{ padding:'12px 14px',borderBottom:'1px solid var(--b1)',flexShrink:0 }}>
        <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'4px' }}>
          Centre d'alertes
        </div>
        <div style={{ display:'flex',gap:'6px' }}>
          <span className="chip chip-f">{fraudCount} Fraude{fraudCount>1?'s':''}</span>
          <span className="chip chip-s">{suspectCount} Suspect{suspectCount>1?'s':''}</span>
        </div>
      </div>
      <div style={{ flex:1,overflowY:'auto',padding:'10px',display:'flex',flexDirection:'column',gap:'8px' }}>
        {alerts.length===0
          ? <div style={{ padding:'40px 20px',textAlign:'center',color:'var(--t3)',fontSize:'13px' }}>
              Aucune alerte active
            </div>
          : alerts.map((row,i) => <AlertCard key={row.tx.id} row={row} isNew={i===0} onClick={onSelect}/>)
        }
      </div>
    </div>
  )
}
