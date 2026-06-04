// Top 15 features by discriminative power (SHAP analysis on ULB dataset)
export const TOP15 = ['V14','V17','V12','V10','V4','V11','V3','V7','V16','V1','V18','V2','V9','V21','V5']

// Features where negative value = fraud direction
export const NEG_DIR = new Set(['V14','V17','V12','V10','V3','V7','V16','V1','V18','V9','V21','V5'])
// Features where positive value = fraud direction
export const POS_DIR = new Set(['V4','V11','V2'])

const NORMAL = Object.fromEntries(Array.from({length:28},(_,i)=>[`V${i+1}`,[-2,2]]))
const FRAUD  = { ...NORMAL, V14:[-9,-3],V17:[-9,-3],V12:[-7,-2],V10:[-7,-2],
  V4:[2,7],V11:[2,7],V3:[-7,-2],V7:[-6,-2],V16:[-5,-1],V1:[-5,-1],
  V18:[-4,-1],V2:[1,5],V9:[-4,-1],V21:[-3,1],V5:[-4,-1] }

function r(min,max) { return Math.random()*(max-min)+min }
function ri(min,max){ return Math.floor(r(min,max+1)) }

let txId = 1

export function generateTx() {
  const isFraud = Math.random() < 0.055
  const R       = isFraud ? FRAUD : NORMAL
  const hour    = ri(0,23), minute = ri(0,59)
  const amount  = isFraud ? +r(0.5,300).toFixed(2) : +r(5,5000).toFixed(2)
  const feats   = {}
  for(let i=1;i<=28;i++){ const k=`V${i}`; feats[k]=+r(...R[k]).toFixed(4) }
  return { id:txId++, ts:new Date(), hour, minute,
    timeLabel:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,
    amount, trueClass:isFraud?1:0, ...feats }
}

// Feature weights (mirrors RF importance from SHAP analysis)
export const W = { V14:0.30,V17:0.25,V12:0.18,V10:0.14,V4:0.12,V11:0.10,
  V3:0.09,V7:0.08,V16:0.07,V1:0.07,V18:0.06,V2:0.05,V9:0.05,V21:0.04,V5:0.04 }

export function computeScore(tx) {
  let s = 0
  TOP15.forEach(k => {
    if(NEG_DIR.has(k)){
      if(tx[k]<-3)    s+=W[k]*100
      else if(tx[k]<-1.5) s+=W[k]*50
    } else if(POS_DIR.has(k)){
      if(tx[k]>3)     s+=W[k]*100
      else if(tx[k]>1.5)  s+=W[k]*50
    }
  })
  if(tx.hour>=0&&tx.hour<=5) s+=8
  if(tx.amount<1) s+=16
  else if(tx.amount<10) s+=5
  s += r(-4,4)
  return Math.round(Math.max(0,Math.min(100,s)))
}

export function getVerdict(sc) { return sc>=62?'fraud':sc>=28?'suspect':'normal' }

// SHAP-style contribution per feature
// Positive = pushes toward FRAUD, Negative = pushes toward NORMAL
export function computeSHAP(tx) {
  const contribs = TOP15.map(feat => {
    const val = tx[feat]
    const w   = W[feat] || 0.03
    let contrib = 0

    if(NEG_DIR.has(feat)){
      // More negative = more fraud-like → positive contribution to fraud score
      if(val < -4)     contrib =  w * 30
      else if(val < -3) contrib =  w * 22
      else if(val < -2) contrib =  w * 14
      else if(val < -1.5) contrib = w * 8
      else if(val < 0)  contrib =  w * 1.5
      else              contrib = -w * 4  // positive val = normal signal
    } else if(POS_DIR.has(feat)){
      // More positive = more fraud-like
      if(val > 4)      contrib =  w * 30
      else if(val > 3)  contrib =  w * 22
      else if(val > 2)  contrib =  w * 14
      else if(val > 1.5) contrib = w * 8
      else if(val > 0)  contrib =  w * 1.5
      else              contrib = -w * 4
    }
    const anomaly = (NEG_DIR.has(feat)&&val<-1.5)||(POS_DIR.has(feat)&&val>1.5)
    return { feat, val:+val.toFixed(4), contrib:+contrib.toFixed(3), anomaly, weight:w }
  })
  return contribs.sort((a,b) => Math.abs(b.contrib)-Math.abs(a.contrib))
}

// Anomaly level 0-3 for heat strip
export function anomalyLevel(feat, val) {
  if(NEG_DIR.has(feat)){
    if(val < -4) return 3
    if(val < -3) return 2
    if(val < -1.5) return 1
    return 0
  }
  if(POS_DIR.has(feat)){
    if(val > 4) return 3
    if(val > 3) return 2
    if(val > 1.5) return 1
    return 0
  }
  return 0
}

export function getTopReasons(tx, verdict) {
  if(verdict==='normal') return []
  return computeSHAP(tx).filter(c=>c.contrib>0).slice(0,3)
}

export function getFeatureChartData(tx) {
  return TOP15.map(k => ({
    feat:k, val:+tx[k].toFixed(3),
    anomaly:(NEG_DIR.has(k)&&tx[k]<-1.5)||(POS_DIR.has(k)&&tx[k]>1.5),
    weight:W[k]||0.03,
  }))
}

export const VERDICT_CFG = {
  normal:  { label:'Normal',  chip:'chip-n', color:'var(--green)', dim:'var(--green-dim)', border:'var(--green-b)' },
  suspect: { label:'Suspect', chip:'chip-s', color:'var(--amber)', dim:'var(--amber-dim)', border:'var(--amber-b)' },
  fraud:   { label:'Fraude',  chip:'chip-f', color:'var(--red)',   dim:'var(--red-dim)',   border:'var(--red-b)' },
}
