import React, { useState } from 'react'
import { VERDICT_CFG, TOP15, anomalyLevel } from '../utils/engine'

// Color for each anomaly level
const HEAT_COLORS = [
  'rgba(91,142,240,0.18)',   // 0 = normal
  'rgba(245,184,73,0.55)',   // 1 = mild
  'rgba(249,96,96,0.65)',    // 2 = moderate
  'rgba(249,96,96,0.95)',    // 3 = high
]
const HEAT_BORDERS = [
  'transparent',
  'rgba(245,184,73,0.4)',
  'rgba(249,96,96,0.5)',
  'rgba(249,96,96,0.9)',
]

function FeatureHeatStrip({ tx }) {
  const [tooltip, setTooltip] = useState(null)
  return (
    <div style={{ position:'relative', display:'flex', gap:'2px', alignItems:'center' }}>
      {TOP15.map((feat, i) => {
        const level = anomalyLevel(feat, tx[feat])
        return (
          <div
            key={feat}
            onMouseEnter={e => setTooltip({ feat, val: tx[feat], level, x: e.clientX, y: e.clientY })}
            onMouseLeave={() => setTooltip(null)}
            style={{
              width:'9px', height:'20px', borderRadius:'2px',
              background: HEAT_COLORS[level],
              border: `1px solid ${HEAT_BORDERS[level]}`,
              cursor: 'default', flexShrink:0,
            }}
          />
        )
      })}
      {tooltip && (
        <div style={{
          position:'fixed', zIndex:999,
          left: tooltip.x + 10, top: tooltip.y - 30,
          background:'var(--s3)', border:'1px solid var(--b3)',
          borderRadius:'5px', padding:'5px 9px',
          fontSize:'11px', pointerEvents:'none',
          color: tooltip.level>0 ? 'var(--red)' : 'var(--t2)',
          fontFamily:'var(--mono)',
          boxShadow:'0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color:'var(--t3)' }}>{tooltip.feat}: </span>
          {tooltip.val.toFixed(4)}
          {tooltip.level > 0 && <span style={{ color:'var(--red)', marginLeft:4 }}>⚠ anormal</span>}
        </div>
      )}
    </div>
  )
}

function TxRow({ row, idx, onClick }) {
  const cfg   = VERDICT_CFG[row.vd]
  const isNew = idx === 0

  return (
    <div
      className={isNew ? 'anim-row' : ''}
      onClick={() => onClick(row)}
      style={{
        display:'grid',
        gridTemplateColumns:'10px 50px 44px 86px 1fr 70px 88px',
        alignItems:'center', gap:0,
        padding:'8px 14px', borderBottom:'1px solid var(--b1)',
        cursor:'pointer', background: isNew?'var(--s2)':'transparent',
        transition:'background 0.3s',
      }}
      onMouseEnter={e => e.currentTarget.style.background='var(--s2)'}
      onMouseLeave={e => e.currentTarget.style.background = isNew?'var(--s2)':'transparent'}
    >
      <div style={{ width:8,height:8,borderRadius:'50%',background:cfg.color }} />

      <span style={{ fontSize:'11px',color:'var(--t3)',fontFamily:'var(--mono)' }}>
        #{String(row.tx.id).padStart(4,'0')}
      </span>

      <span style={{ fontSize:'12px',color:'var(--t2)',fontFamily:'var(--mono)' }}>
        {row.tx.timeLabel}
      </span>

      <span style={{ fontSize:'13px',fontWeight:500,color:'var(--t1)',fontFamily:'var(--mono)' }}>
        {row.tx.amount.toFixed(2)} €
      </span>

      {/* 15-feature heat strip */}
      <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
        <FeatureHeatStrip tx={row.tx} />
      </div>

      {/* Score bar */}
      <div style={{ display:'flex',alignItems:'center',gap:'5px' }}>
        <div style={{ flex:1,height:'3px',background:'var(--s3)',borderRadius:'2px' }}>
          <div style={{ width:`${row.sc}%`,height:'100%',background:cfg.color,borderRadius:'2px' }} />
        </div>
        <span style={{ fontSize:'10px',color:cfg.color,fontFamily:'var(--mono)',minWidth:'22px' }}>
          {row.sc}
        </span>
      </div>

      <span className={`chip ${cfg.chip}`}>{cfg.label}</span>
    </div>
  )
}

export default function FeedPanel({ feed, onSelect }) {
  return (
    <div className="card" style={{ flex:1,display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'12px 14px',borderBottom:'1px solid var(--b1)',flexShrink:0 }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)' }}>Flux de transactions</div>
            <div style={{ fontSize:'11px',color:'var(--t3)',marginTop:'1px' }}>
              Cliquez sur une ligne pour les détails complets + explication SHAP
            </div>
          </div>
          <div style={{ display:'flex',gap:'10px',fontSize:'11px' }}>
            {[['var(--green)','Normal'],['var(--amber)','Suspect'],['var(--red)','Fraude']].map(([c,l])=>(
              <span key={l} style={{ display:'flex',alignItems:'center',gap:'4px',color:'var(--t3)' }}>
                <span style={{ width:6,height:6,borderRadius:'50%',background:c,display:'inline-block' }}/>
                {l}
              </span>
            ))}
          </div>
        </div>
        {/* Heat strip legend */}
        <div style={{ marginTop:'8px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
          <span style={{ fontSize:'10px',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.06em' }}>
            Indicateur 15 features :
          </span>
          {[
            [HEAT_COLORS[0],'Normal'],
            [HEAT_COLORS[1],'Légèrement anormal'],
            [HEAT_COLORS[2],'Anormal'],
            [HEAT_COLORS[3],'Très anormal'],
          ].map(([c,l])=>(
            <span key={l} style={{ display:'flex',alignItems:'center',gap:'4px',fontSize:'10px',color:'var(--t3)' }}>
              <span style={{ width:9,height:14,borderRadius:'2px',background:c,display:'inline-block' }}/>
              {l}
            </span>
          ))}
          <span style={{ fontSize:'10px',color:'var(--t4)',marginLeft:'4px' }}>
            (survoler une case = voir la valeur)
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'10px 50px 44px 86px 1fr 70px 88px',
        gap:0, padding:'7px 14px',
        borderBottom:'1px solid var(--b1)',
        background:'var(--bg)', flexShrink:0,
      }}>
        {['','ID','Heure','Montant','Top 15 features (survol = valeur)','Score','Verdict'].map((h,i)=>(
          <span key={i} style={{
            fontSize:'10px',color:'var(--t4)',
            textTransform:'uppercase',letterSpacing:'0.07em',fontWeight:500,
          }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex:1,overflowY:'auto' }}>
        {feed.length===0
          ? <div style={{ padding:'40px',textAlign:'center',color:'var(--t3)' }}>En attente…</div>
          : feed.map((row,i) => <TxRow key={row.tx.id} row={row} idx={i} onClick={onSelect} />)
        }
      </div>
    </div>
  )
}
