import React, { useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts'

const CustomTooltip = ({ active, payload }) => {
  if(!active||!payload?.length) return null
  const d = payload[0]?.payload
  if(!d) return null
  return (
    <div style={{
      background:'var(--s2)',border:'1px solid var(--b2)',
      borderRadius:'8px',padding:'10px 14px',fontSize:'12px',
    }}>
      <div style={{ color:'var(--t3)',marginBottom:'6px',fontSize:'10px' }}>Fenêtre de 8 transactions</div>
      {[
        { key:'total',   color:'var(--blue)', label:'Total transactions' },
        { key:'frauds',  color:'var(--red)',  label:'Fraudes détectées' },
        { key:'suspects',color:'var(--amber)',label:'Suspects' },
        { key:'fraudRate',color:'var(--red)', label:'Taux fraude (%)' },
      ].map(({ key, color, label }) => (
        <div key={key} style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px' }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:color }}/>
          <span style={{ color:'var(--t2)' }}>{label}</span>
          <span style={{ color:'var(--t1)',fontFamily:'var(--mono)',marginLeft:'auto',paddingLeft:'16px' }}>
            {d[key] ?? 0}{key==='fraudRate'?'%':''}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EvolutionChart({ evoData }) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <div className="card" style={{ padding:'14px 18px' }}>
      {/* Header */}
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px' }}>
        <div>
          <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)' }}>
            Évolution des transactions dans le temps
          </div>
          <div style={{ fontSize:'11px',color:'var(--t3)',marginTop:'2px' }}>
            Chaque point = fenêtre de 8 transactions ·{' '}
            <span style={{ color:'var(--blue)' }}>Bleu : total</span>{' · '}
            <span style={{ color:'var(--red)' }}>Rouge : fraudes</span>{' · '}
            <span style={{ color:'var(--amber)' }}>Orange pointillé : suspects</span>{' · '}
            <span style={{ color:'var(--red)',opacity:0.6 }}>Rouge fin : taux fraude %</span>
          </div>
        </div>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            background:'var(--s3)',border:'1px solid var(--b2)',borderRadius:'5px',
            padding:'4px 10px',cursor:'pointer',fontSize:'11px',color:'var(--t2)',
            fontFamily:'var(--font)',flexShrink:0,
          }}
        >
          {showInfo ? '▲ Masquer' : '? Comment lire'}
        </button>
      </div>

      {/* Explanation box */}
      {showInfo && (
        <div style={{
          background:'var(--s3)',border:'1px solid var(--b2)',borderRadius:'8px',
          padding:'12px 16px',marginBottom:'12px',fontSize:'11px',color:'var(--t2)',lineHeight:1.7,
        }}>
          <strong style={{ color:'var(--t1)' }}>Comment lire ce graphique :</strong>
          <br/>
          Le temps est découpé en <strong>fenêtres de 8 transactions</strong>. Pour chaque fenêtre, on trace :{' '}
          <span style={{ color:'var(--blue)' }}>■ Ligne bleue</span> = nombre total de transactions dans cette fenêtre (devrait rester autour de 8).{' '}
          <span style={{ color:'var(--red)' }}>■ Ligne rouge épaisse</span> = nombre de fraudes détectées.{' '}
          <span style={{ color:'var(--amber)' }}>■ Ligne orange pointillée</span> = nombre de suspects.{' '}
          <span style={{ color:'var(--red)',opacity:0.6 }}>■ Ligne rouge fine</span> = taux de fraude en % (fraudes / total × 100).
          <br/>
          <strong>À surveiller :</strong> si la ligne rouge monte fortement sur plusieurs fenêtres consécutives,
          cela signale une période d'activité frauduleuse accrue — en production réelle, cela déclencherait une alerte.
        </div>
      )}

      <ResponsiveContainer width="100%" height={100}>
        <ComposedChart data={evoData} margin={{ top:4,right:8,left:-24,bottom:0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="var(--blue)" stopOpacity={0.15}/>
              <stop offset="100%" stopColor="var(--blue)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--b1)" strokeDasharray="3 0" vertical={false}/>
          <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false}/>
          <YAxis yAxisId="left"  tick={{ fontSize:10,fill:'var(--t3)' }} axisLine={false} tickLine={false} allowDecimals={false}/>
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize:9,fill:'var(--t3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/>
          <Tooltip content={<CustomTooltip/>}/>
          <Area yAxisId="left" type="monotone" dataKey="total" name="Total"
            stroke="var(--blue)" strokeWidth={1.5} fill="url(#gradTotal)" dot={false} isAnimationActive={false}/>
          <Line yAxisId="left" type="monotone" dataKey="frauds" name="Fraudes"
            stroke="var(--red)" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
          <Line yAxisId="left" type="monotone" dataKey="suspects" name="Suspects"
            stroke="var(--amber)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} isAnimationActive={false}/>
          <Line yAxisId="right" type="monotone" dataKey="fraudRate" name="Taux fraude %"
            stroke="var(--red)" strokeWidth={1} strokeDasharray="2 3" opacity={0.5} dot={false} isAnimationActive={false}/>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
