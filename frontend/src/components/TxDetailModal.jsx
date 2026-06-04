import React from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { VERDICT_CFG } from '../utils/engine'

function ScoreRing({ score, verdict }) {
  const r=38, cx=48, cy=48, circ=2*Math.PI*r
  const color = VERDICT_CFG[verdict].color
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--s3)" strokeWidth="6"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${circ*(score/100)} ${circ*(1-score/100)}`}
        strokeLinecap="round" transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition:'stroke-dasharray 0.5s ease' }}
      />
      <text x={cx} y={cy-6} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize:'20px',fontWeight:700,fontFamily:'var(--mono)',fill:color }}>{score}</text>
      <text x={cx} y={cy+14} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize:'9px',fill:'var(--t3)',letterSpacing:'0.06em' }}>/ 100</text>
    </svg>
  )
}

// SHAP waterfall — div-based for full control
function SHAPWaterfall({ shapData, score, verdict }) {
  const cfg   = VERDICT_CFG[verdict]
  const maxAbs = Math.max(...shapData.map(d => Math.abs(d.contrib)), 0.1)
  const fraudContribs   = shapData.filter(d => d.contrib > 0)
  const normalContribs  = shapData.filter(d => d.contrib <= 0)

  const totalFraud  = fraudContribs.reduce((a,b) => a+b.contrib, 0)
  const totalNormal = normalContribs.reduce((a,b) => a+b.contrib, 0)

  return (
    <div>
      {/* Explanation banner */}
      <div style={{
        background:'var(--s3)', border:'1px solid var(--b2)',
        borderRadius:'7px', padding:'10px 14px', marginBottom:'14px',
        fontSize:'11px', color:'var(--t2)', lineHeight:1.6,
      }}>
        <strong style={{ color:'var(--t1)' }}>Comment lire ce graphique SHAP :</strong>
        <br/>
        Chaque barre montre comment une feature <em>contribue au score de fraude final</em>.
        <br/>
        <span style={{ color:'var(--red)', fontWeight:500 }}>■ Barre rouge</span> = feature qui pousse vers FRAUDE (augmente le score).&nbsp;
        <span style={{ color:'var(--blue)', fontWeight:500 }}>■ Barre bleue</span> = feature qui pousse vers NORMAL (diminue le score).
        <br/>
        La longueur de la barre = l'importance de son impact.
      </div>

      {/* Summary line */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
        <div style={{ background:'var(--red-dim)', border:'1px solid var(--red-b)', borderRadius:'6px', padding:'8px 12px', flex:1 }}>
          <div style={{ fontSize:'10px', color:'var(--t3)', marginBottom:'3px' }}>Contribution FRAUDE totale</div>
          <div style={{ fontSize:'16px', fontWeight:600, color:'var(--red)', fontFamily:'var(--mono)' }}>
            +{totalFraud.toFixed(2)}
          </div>
          <div style={{ fontSize:'10px', color:'var(--t3)' }}>{fraudContribs.length} feature(s) anormale(s)</div>
        </div>
        <div style={{ background:'var(--blue-dim)', border:'1px solid rgba(91,142,240,0.3)', borderRadius:'6px', padding:'8px 12px', flex:1 }}>
          <div style={{ fontSize:'10px', color:'var(--t3)', marginBottom:'3px' }}>Contribution NORMAL totale</div>
          <div style={{ fontSize:'16px', fontWeight:600, color:'var(--blue)', fontFamily:'var(--mono)' }}>
            {totalNormal.toFixed(2)}
          </div>
          <div style={{ fontSize:'10px', color:'var(--t3)' }}>{normalContribs.length} feature(s) normale(s)</div>
        </div>
        <div style={{ background:'var(--s3)', border:`1px solid ${cfg.border}`, borderRadius:'6px', padding:'8px 12px', flex:1 }}>
          <div style={{ fontSize:'10px', color:'var(--t3)', marginBottom:'3px' }}>Score final</div>
          <div style={{ fontSize:'16px', fontWeight:600, color:cfg.color, fontFamily:'var(--mono)' }}>
            {score} / 100
          </div>
          <div style={{ fontSize:'10px', color:'var(--t3)' }}>Seuil fraude : ≥ 62</div>
        </div>
      </div>

      {/* Waterfall bars */}
      <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
        {shapData.map((d, i) => {
          const pct    = Math.abs(d.contrib) / maxAbs * 100
          const isFraud = d.contrib > 0
          return (
            <div key={d.feat} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              {/* Feature name */}
              <div style={{ width:'36px', flexShrink:0 }}>
                <span style={{
                  fontSize:'11px', fontFamily:'var(--mono)',
                  color: d.anomaly ? (isFraud ? 'var(--red)' : 'var(--blue)') : 'var(--t3)',
                  fontWeight: d.anomaly ? 500 : 400,
                }}>
                  {d.feat}
                </span>
              </div>

              {/* Bar */}
              <div style={{ flex:1, height:'14px', position:'relative', display:'flex', alignItems:'center' }}>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center' }}>
                  <div style={{
                    height:'10px', borderRadius:'2px',
                    width:`${pct}%`, minWidth: Math.abs(d.contrib) > 0.001 ? '2px' : '0',
                    background: isFraud ? 'var(--red)' : 'var(--blue)',
                    opacity: d.anomaly ? 0.9 : 0.4,
                  }}/>
                </div>
              </div>

              {/* Contribution value */}
              <div style={{ width:'52px', textAlign:'right', flexShrink:0 }}>
                <span style={{
                  fontSize:'11px', fontFamily:'var(--mono)',
                  color: isFraud ? 'var(--red)' : 'var(--blue)',
                  fontWeight: d.anomaly ? 600 : 400,
                }}>
                  {d.contrib > 0 ? '+' : ''}{d.contrib.toFixed(3)}
                </span>
              </div>

              {/* Raw PCA value */}
              <div style={{ width:'62px', textAlign:'right', flexShrink:0 }}>
                <span style={{ fontSize:'10px', color:'var(--t4)', fontFamily:'var(--mono)' }}>
                  ({d.val > 0 ? '+' : ''}{d.val})
                </span>
              </div>

              {/* Anomaly flag */}
              <div style={{ width:'14px', flexShrink:0 }}>
                {d.anomaly && <span style={{ fontSize:'10px', color: isFraud?'var(--red)':'var(--amber)' }}>⚠</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Column legend */}
      <div style={{
        marginTop:'12px', paddingTop:'10px', borderTop:'1px solid var(--b1)',
        display:'flex', gap:'20px', fontSize:'10px', color:'var(--t4)',
      }}>
        <span>FEAT = nom de la feature</span>
        <span>Barre = contribution au score</span>
        <span>(val) = valeur PCA brute</span>
        <span>⚠ = valeur anormale détectée</span>
      </div>
    </div>
  )
}

// Feature chart (raw PCA values)
const CustomTooltipFeature = ({ active, payload }) => {
  if(!active||!payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'6px',padding:'8px 12px',fontSize:'12px' }}>
      <div style={{ color:'var(--t1)',fontWeight:500 }}>{d.feat}</div>
      <div style={{ color:d.anomaly?'var(--red)':'var(--t2)',fontFamily:'var(--mono)' }}>
        Valeur PCA : {d.val>0?'+':''}{d.val}
      </div>
      {d.anomaly && <div style={{ color:'var(--red)',fontSize:'10px',marginTop:'2px' }}>⚠ Valeur anormale</div>}
      <div style={{ color:'var(--t4)',fontSize:'10px',marginTop:'2px' }}>
        Importance RF : {(d.weight*100).toFixed(0)}%
      </div>
    </div>
  )
}

export default function TxDetailModal({ row, onClose }) {
  if(!row) return null
  const cfg = VERDICT_CFG[row.vd]

  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',
        zIndex:100,backdropFilter:'blur(2px)',
      }}/>
      <div className="anim-modal" style={{
        position:'fixed',top:0,right:0,bottom:0,
        width:'560px',background:'var(--s1)',
        borderLeft:'1px solid var(--b2)',
        zIndex:101,display:'flex',flexDirection:'column',
        overflowY:'auto',
      }}>
        {/* Header */}
        <div style={{
          padding:'18px 22px',borderBottom:'1px solid var(--b1)',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          position:'sticky',top:0,background:'var(--s1)',zIndex:10,
        }}>
          <div>
            <div style={{ fontWeight:600,fontSize:'15px',color:'var(--t1)' }}>
              Transaction #{String(row.tx.id).padStart(4,'0')}
            </div>
            <div style={{ fontSize:'11px',color:'var(--t3)',marginTop:'2px' }}>
              {row.tx.ts.toLocaleDateString('fr-FR')} · {row.tx.timeLabel}
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'var(--s2)',border:'1px solid var(--b2)',
            borderRadius:'6px',padding:'6px 12px',cursor:'pointer',
            color:'var(--t2)',fontSize:'13px',fontFamily:'var(--font)',
          }}>✕ Fermer</button>
        </div>

        <div style={{ padding:'20px 22px',display:'flex',flexDirection:'column',gap:'18px' }}>

          {/* Score + verdict */}
          <div style={{
            background:'var(--s2)',border:`1px solid ${cfg.border}`,
            borderRadius:'10px',padding:'16px',
            display:'flex',gap:'16px',alignItems:'center',
          }}>
            <ScoreRing score={row.sc} verdict={row.vd} />
            <div style={{ flex:1 }}>
              <span className={`chip ${cfg.chip}`} style={{ fontSize:'12px',marginBottom:'10px',display:'inline-flex' }}>
                {cfg.label}
              </span>
              <div style={{ fontSize:'28px',fontWeight:700,color:'var(--t1)',lineHeight:1,marginBottom:'4px',fontFamily:'var(--mono)' }}>
                {row.tx.amount.toFixed(2)} €
              </div>
              <div style={{ fontSize:'12px',color:'var(--t3)' }}>
                Heure : {row.tx.timeLabel} · Score : <span style={{ color:cfg.color,fontFamily:'var(--mono)',fontWeight:500 }}>{row.sc}/100</span>
              </div>
              <div style={{ fontSize:'11px',color:'var(--t3)',marginTop:'4px' }}>
                Seuil fraude ≥ 62 · Seuil suspect ≥ 28 · Seuil optimal RF = 0.059
              </div>
            </div>
          </div>

          {/* === SHAP SECTION === */}
          <div style={{ background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:'10px',padding:'18px' }}>
            <div style={{ marginBottom:'14px' }}>
              <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'2px' }}>
                Explication SHAP — Pourquoi ce score ?
              </div>
              <div style={{ fontSize:'11px',color:'var(--t3)' }}>
                Basé sur les poids du modèle Random Forest (top 15 features par importance)
              </div>
            </div>
            <SHAPWaterfall shapData={row.shapData} score={row.sc} verdict={row.vd} />
          </div>

          {/* Raw PCA chart */}
          <div style={{ background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:'10px',padding:'18px' }}>
            <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'4px' }}>
              Valeurs PCA brutes — Top 15
            </div>
            <div style={{ fontSize:'11px',color:'var(--t3)',marginBottom:'12px' }}>
              Les features sont des composantes PCA anonymisées. Les valeurs proches de 0 sont normales.
              <br/>
              <span style={{ color:'var(--red)' }}>■ Rouge</span> = valeur anormale · <span style={{ color:'var(--blue)' }}>■ Bleu</span> = valeur normale
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={row.fData} layout="vertical" margin={{ top:0,right:50,left:10,bottom:0 }}>
                <XAxis type="number" domain={[-10,10]} tick={{ fontSize:10,fill:'var(--t3)' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="feat" width={36}
                  tick={{ fontSize:11,fill:'var(--t2)',fontFamily:'var(--mono)' }}
                  axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltipFeature/>}/>
                <ReferenceLine x={0} stroke="var(--b3)" strokeWidth={1}/>
                <Bar dataKey="val" radius={[0,3,3,0]} maxBarSize={14}>
                  {row.fData.map((d,i) => (
                    <Cell key={i}
                      fill={d.anomaly?'var(--red)':'var(--blue)'}
                      fillOpacity={d.anomaly?0.85:0.5}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Feature value grid */}
          <div style={{ background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:'10px',padding:'18px' }}>
            <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'12px' }}>
              Valeurs numériques — Top 15
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'6px' }}>
              {row.fData.map(d=>(
                <div key={d.feat} style={{
                  background: d.anomaly?'var(--red-dim)':'var(--s3)',
                  border:`1px solid ${d.anomaly?'var(--red-b)':'var(--b2)'}`,
                  borderRadius:'6px',padding:'7px 10px',
                }}>
                  <div style={{ fontSize:'10px',color:d.anomaly?'var(--red)':'var(--t3)',fontFamily:'var(--mono)',marginBottom:'2px' }}>
                    {d.feat}{d.anomaly?' ⚠':''}
                  </div>
                  <div style={{ fontSize:'12px',fontWeight:500,color:d.anomaly?'var(--red)':'var(--t1)',fontFamily:'var(--mono)' }}>
                    {d.val>0?'+':''}{d.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div style={{ background:'var(--s2)',border:'1px solid var(--b1)',borderRadius:'10px',padding:'16px' }}>
            <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'12px' }}>
              Métadonnées
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px' }}>
              {[
                ['ID', `#${String(row.tx.id).padStart(4,'0')}`],
                ['Heure', row.tx.timeLabel],
                ['Montant', `${row.tx.amount.toFixed(2)} €`],
                ['Score', `${row.sc} / 100`],
                ['Verdict', cfg.label],
                ['Horodatage', row.tx.ts.toLocaleTimeString('fr-FR')],
              ].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:'10px',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:'3px' }}>{l}</div>
                  <div style={{ fontSize:'13px',color:'var(--t1)',fontFamily:'var(--mono)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
