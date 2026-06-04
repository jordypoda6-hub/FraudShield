import React, { useState, useMemo } from 'react'
import { VERDICT_CFG } from '../utils/engine'

const PAGE = 50

export default function HistoryView({ history, onSelect }) {
  const [page,   setPage]   = useState(0)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    let rows = [...history].reverse()
    if (filter !== 'all') rows = rows.filter(r => r.vd === filter)
    if (search) rows = rows.filter(r =>
      String(r.tx.id).includes(search) ||
      String(r.tx.amount).includes(search)
    )
    return rows
  }, [history, filter, search])

  const pages    = Math.max(1, Math.ceil(filtered.length / PAGE))
  const pageRows = filtered.slice(page * PAGE, (page + 1) * PAGE)

  const counts = useMemo(() => ({
    all:     history.length,
    fraud:   history.filter(r=>r.vd==='fraud').length,
    suspect: history.filter(r=>r.vd==='suspect').length,
    normal:  history.filter(r=>r.vd==='normal').length,
  }), [history])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      {/* Controls */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Filter tabs */}
        <div style={{
          display: 'flex', background: 'var(--s1)',
          border: '1px solid var(--b1)', borderRadius: '7px', padding: '3px', gap: '2px',
        }}>
          {[['all','Toutes',counts.all],['fraud','Fraudes',counts.fraud],['suspect','Suspects',counts.suspect],['normal','Normales',counts.normal]].map(([v,l,c])=>(
            <button key={v} onClick={()=>{ setFilter(v); setPage(0) }} style={{
              padding: '5px 12px', borderRadius: '5px', cursor: 'pointer',
              border: 'none', fontFamily: 'var(--font)', fontSize: '12px',
              background: filter===v ? 'var(--s3)' : 'transparent',
              color:      filter===v ? 'var(--t1)' : 'var(--t3)',
              fontWeight: filter===v ? 500 : 400,
            }}>
              {l} <span style={{ fontSize:'10px', opacity:0.7 }}>({c})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          placeholder="Chercher par ID ou montant…"
          value={search}
          onChange={e=>{ setSearch(e.target.value); setPage(0) }}
          style={{
            flex: 1, padding: '7px 12px', borderRadius: '7px',
            background: 'var(--s1)', border: '1px solid var(--b1)',
            color: 'var(--t1)', fontSize: '12px', fontFamily: 'var(--font)',
            outline: 'none',
          }}
        />

        <span style={{ fontSize: '12px', color: 'var(--t3)', flexShrink: 0 }}>
          {filtered.length.toLocaleString('fr-FR')} résultats
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <table className="tbl">
            <thead>
              <tr>
                {['ID','Heure','Montant','Score','V14','V17','V12','V4','V10','V11','Verdict'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0
                ? <tr><td colSpan={11} style={{ textAlign:'center', color:'var(--t3)', padding:'40px' }}>Aucune transaction</td></tr>
                : pageRows.map((row, i) => {
                    const cfg = VERDICT_CFG[row.vd]
                    return (
                      <tr
                        key={row.tx.id}
                        className={row.vd==='fraud'?'fraud-row':''}
                        onClick={()=>onSelect(row)}
                        style={{ cursor:'pointer' }}
                      >
                        <td style={{ fontFamily:'var(--mono)', color:'var(--t3)' }}>#{String(row.tx.id).padStart(4,'0')}</td>
                        <td style={{ fontFamily:'var(--mono)' }}>{row.tx.timeLabel}</td>
                        <td style={{ fontFamily:'var(--mono)', fontWeight:500 }}>{row.tx.amount.toFixed(2)} €</td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                            <div style={{ width:'40px', height:'3px', background:'var(--s3)', borderRadius:'2px' }}>
                              <div style={{ width:`${row.sc}%`, height:'100%', background:cfg.color, borderRadius:'2px' }} />
                            </div>
                            <span style={{ color:cfg.color, fontFamily:'var(--mono)', fontSize:'11px' }}>{row.sc}</span>
                          </div>
                        </td>
                        {['V14','V17','V12','V4','V10','V11'].map(k=>{
                          const anom = (['V14','V17','V12','V10'].includes(k) && row.tx[k]<-1.5) ||
                                       (['V4','V11'].includes(k) && row.tx[k]>1.5)
                          return (
                            <td key={k} style={{ fontFamily:'var(--mono)', color: anom?'var(--red)':'var(--t3)', fontSize:'11px' }}>
                              {row.tx[k].toFixed(3)}
                            </td>
                          )
                        })}
                        <td><span className={`chip ${cfg.chip}`}>{cfg.label}</span></td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{
            padding: '10px 14px', borderTop: '1px solid var(--b1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize:'12px', color:'var(--t3)' }}>
              Page {page+1} / {pages}
            </span>
            <div style={{ display:'flex', gap:'4px' }}>
              {[['← Précédent', page>0, ()=>setPage(p=>p-1)],
                ['Suivant →',  page<pages-1, ()=>setPage(p=>p+1)]].map(([label, enabled, action])=>(
                <button key={label} onClick={action} disabled={!enabled} style={{
                  padding:'5px 12px', fontSize:'12px', borderRadius:'5px', cursor: enabled?'pointer':'not-allowed',
                  background:'var(--s2)', border:'1px solid var(--b2)',
                  color: enabled?'var(--t1)':'var(--t4)', fontFamily:'var(--font)',
                  opacity: enabled?1:0.4,
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
