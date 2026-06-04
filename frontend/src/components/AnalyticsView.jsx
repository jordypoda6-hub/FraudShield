import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

export default function AnalyticsView({ history, stats }) {
  const distribution = useMemo(() => [
    { name:'Normal',  value:stats.normal,   color:'var(--green)' },
    { name:'Suspect', value:stats.suspects, color:'var(--amber)' },
    { name:'Fraude',  value:stats.frauds,   color:'var(--red)' },
  ],[stats])

  const hourData = useMemo(() => {
    const b = Array.from({length:24},(_,i)=>({ hour:`${String(i).padStart(2,'0')}h`,frauds:0,total:0 }))
    history.forEach(r => {
      b[r.tx.hour].total++
      if(r.vd==='fraud') b[r.tx.hour].frauds++
    })
    return b
  },[history])

  const topFeatureAnomaly = useMemo(() => {
    const counts = Object.fromEntries(['V14','V17','V12','V10','V4','V11','V3','V7','V16','V1','V18','V2','V9','V21','V5'].map(k=>[k,0]))
    history.filter(r=>r.vd==='fraud').forEach(r => {
      r.shapData.filter(d=>d.anomaly).forEach(d=>{ if(counts[d.feat]!=null) counts[d.feat]++ })
    })
    return Object.entries(counts).map(([feat,count])=>({ feat,count })).sort((a,b)=>b.count-a.count)
  },[history])

  // Computed from simulation
  const simFraudRate = stats.total>0 ? ((stats.frauds/stats.total)*100).toFixed(2)+'%' : '—'
  const avgFraudAmt  = stats.frauds>0 ? (stats.saved/stats.frauds).toFixed(0)+' €' : '—'

  if(stats.total===0) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'300px',color:'var(--t3)' }}>
      En attente de données de simulation…
    </div>
  )

  return (
    <div style={{ display:'flex',flexDirection:'column',gap:'14px' }}>

      {/* Model metrics — clearly labeled as from trained RF on ULB */}
      <div style={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'8px',padding:'12px 16px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px' }}>
          <div style={{ width:8,height:8,borderRadius:'50%',background:'var(--blue)' }}/>
          <span style={{ fontSize:'11px',fontWeight:600,color:'var(--blue)',textTransform:'uppercase',letterSpacing:'0.07em' }}>
            Métriques du modèle Random Forest — dataset ULB (284 807 transactions réelles)
          </span>
        </div>
        <div style={{ fontSize:'11px',color:'var(--t3)',marginBottom:'12px' }}>
          Ces valeurs proviennent de l'entraînement sur le vrai dataset de fraude bancaire européen. Elles varieraient sur d'autres datasets.
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px' }}>
          {[
            { label:'AUC-PR',         value:'0.8207', color:'var(--blue)',  note:'Métrique principale' },
            { label:'Seuil optimal',  value:'0.059',  color:'var(--t1)',   note:'Minimise coût métier' },
            { label:'Précision',      value:'98.21%', color:'var(--green)',note:'Vrais positifs / alertes' },
            { label:'Rappel',         value:'77.33%', color:'var(--amber)',note:'Fraudes détectées' },
            { label:'F1-Score',       value:'86.57%', color:'var(--blue)', note:'Équilibre précision/rappel' },
            { label:'AUC-ROC',        value:'0.9737', color:'var(--t2)',   note:'Séparation des classes' },
            { label:'Coût seuil 0.5', value:'10 010€',color:'var(--red)', note:'Hypothèse : FN=500€ FP=10€' },
            { label:'Coût seuil opt.',value:'6 430€', color:'var(--green)',note:'Économie : 3 580€' },
          ].map(s=>(
            <div key={s.label} style={{ background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:'6px',padding:'10px 12px' }}>
              <div style={{ fontSize:'9px',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'4px' }}>{s.label}</div>
              <div style={{ fontSize:'18px',fontWeight:600,color:s.color,fontFamily:'var(--mono)',lineHeight:1,marginBottom:'4px' }}>{s.value}</div>
              <div style={{ fontSize:'10px',color:'var(--t4)' }}>{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Simulation metrics */}
      <div style={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'8px',padding:'12px 16px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px' }}>
          <div className="dot-live" style={{ width:8,height:8 }}/>
          <span style={{ fontSize:'11px',fontWeight:600,color:'var(--green)',textTransform:'uppercase',letterSpacing:'0.07em' }}>
            Métriques de la simulation en cours — calculées en temps réel
          </span>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'8px' }}>
          {[
            { label:'Total analysé',   value:stats.total.toLocaleString('fr-FR'), color:'var(--t1)' },
            { label:'Fraudes sim.',    value:stats.frauds, color:'var(--red)' },
            { label:'Suspects sim.',   value:stats.suspects, color:'var(--amber)' },
            { label:'Taux fraude sim.',value:simFraudRate, color:'var(--red)' },
            { label:'Normales sim.',   value:stats.normal, color:'var(--green)' },
            { label:'Montant sauvé',   value:stats.saved.toLocaleString('fr-FR')+'€', color:'var(--green)' },
            { label:'Moy. montant fraude',value:avgFraudAmt, color:'var(--amber)' },
            { label:'Taux fraude ULB réel',value:'0.17%', color:'var(--t3)' },
          ].map(s=>(
            <div key={s.label} style={{ background:'var(--s1)',border:'1px solid var(--b1)',borderRadius:'6px',padding:'10px 12px' }}>
              <div style={{ fontSize:'9px',color:'var(--t4)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:'4px' }}>{s.label}</div>
              <div style={{ fontSize:'18px',fontWeight:600,color:s.color,fontFamily:'var(--mono)',lineHeight:1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px' }}>
        {/* Distribution pie */}
        <div className="card" style={{ padding:'18px' }}>
          <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'14px' }}>
            Distribution simulation
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:'20px' }}>
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={distribution} cx="50%" cy="50%" innerRadius={42} outerRadius={68}
                  dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {distribution.map((d,i)=><Cell key={i} fill={d.color} fillOpacity={0.85}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,n]} contentStyle={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'6px',fontSize:'12px' }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1, display:'flex',flexDirection:'column',gap:'10px' }}>
              {distribution.map(d=>(
                <div key={d.name}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:'3px' }}>
                    <span style={{ fontSize:'12px',color:'var(--t2)' }}>{d.name}</span>
                    <span style={{ fontSize:'12px',fontFamily:'var(--mono)',color:d.color }}>{d.value}</span>
                  </div>
                  <div style={{ height:'3px',background:'var(--s3)',borderRadius:'2px' }}>
                    <div style={{ width:`${stats.total?Math.round(d.value/stats.total*100):0}%`,height:'100%',background:d.color,borderRadius:'2px' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature anomalies */}
        <div className="card" style={{ padding:'18px' }}>
          <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'4px' }}>
            Features anormales dans les fraudes
          </div>
          <div style={{ fontSize:'11px',color:'var(--t3)',marginBottom:'12px' }}>
            Nombre de fois où chaque feature était anormale dans les transactions frauduleuses simulées
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={topFeatureAnomaly} margin={{ top:0,right:0,left:-22,bottom:0 }}>
              <CartesianGrid stroke="var(--b1)" strokeDasharray="3 0" vertical={false}/>
              <XAxis dataKey="feat" tick={{ fontSize:10,fill:'var(--t3)',fontFamily:'var(--mono)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:10,fill:'var(--t3)' }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'6px',fontSize:'12px' }}/>
              <Bar dataKey="count" name="Anomalies" fill="var(--red)" fillOpacity={0.7} radius={[3,3,0,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly */}
      <div className="card" style={{ padding:'18px' }}>
        <div style={{ fontSize:'13px',fontWeight:600,color:'var(--t1)',marginBottom:'4px' }}>
          Distribution horaire — simulation
        </div>
        <div style={{ fontSize:'11px',color:'var(--t3)',marginBottom:'12px' }}>
          Nombre de transactions et fraudes par heure de la journée dans la simulation actuelle
        </div>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={hourData} margin={{ top:0,right:0,left:-24,bottom:0 }}>
            <CartesianGrid stroke="var(--b1)" strokeDasharray="3 0" vertical={false}/>
            <XAxis dataKey="hour" tick={{ fontSize:9,fill:'var(--t3)',fontFamily:'var(--mono)' }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:10,fill:'var(--t3)' }} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{ background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:'6px',fontSize:'12px' }}/>
            <Bar dataKey="total"  name="Total"   fill="var(--blue)" fillOpacity={0.3} radius={[2,2,0,0]} maxBarSize={12}/>
            <Bar dataKey="frauds" name="Fraudes" fill="var(--red)"  fillOpacity={0.8} radius={[2,2,0,0]} maxBarSize={12}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
