import { useState, useEffect, useRef, useCallback } from 'react'
import { generateTx, getTopReasons, getFeatureChartData, computeSHAP } from '../utils/engine'
import { predictTransaction, checkHealth } from '../utils/api'

export default function useSimulator(speed) {
  const [feed,       setFeed]      = useState([])
  const [history,    setHistory]   = useState([])
  const [evoData,    setEvoData]   = useState(Array(30).fill({ t:'', total:0, frauds:0, suspects:0, fraudRate:0 }))
  const [stats,      setStats]     = useState({ total:0, frauds:0, suspects:0, saved:0, normal:0 })
  const [running,    setRunning]   = useState(true)
  const [apiStatus,  setApiStatus] = useState('checking')

  const iv      = useRef(null)
  const bucket  = useRef({ total:0, frauds:0, suspects:0 })
  const bTick   = useRef(0)
  const pending = useRef(false)

  useEffect(() => {
    checkHealth().then(ok => setApiStatus(ok ? 'connected' : 'offline'))
    const hiv = setInterval(async () => {
      const ok = await checkHealth()
      setApiStatus(ok ? 'connected' : 'offline')
    }, 10000)
    return () => clearInterval(hiv)
  }, [])

  const tick = useCallback(async () => {
    if (pending.current) return
    pending.current = true
    try {
      const tx = generateTx()
      const { score: sc, verdict: vd, source } = await predictTransaction(tx)
      setApiStatus(source === 'model' ? 'connected' : 'offline')

      const reasons  = getTopReasons(tx, vd)
      const fData    = getFeatureChartData(tx)
      const shapData = computeSHAP(tx)
      const row      = { tx, sc, vd, reasons, fData, shapData, source }

      bucket.current.total++
      if (vd === 'fraud')   bucket.current.frauds++
      if (vd === 'suspect') bucket.current.suspects++
      bTick.current++

      if (bTick.current >= 8) {
        const t  = new Date().toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
        const fr = bucket.current.total > 0
          ? +((bucket.current.frauds / bucket.current.total) * 100).toFixed(1) : 0
        setEvoData(prev => [...prev.slice(1), { t, ...bucket.current, fraudRate: fr }])
        bucket.current = { total:0, frauds:0, suspects:0 }
        bTick.current  = 0
      }

      setFeed(prev    => [row, ...prev].slice(0, 80))
      setHistory(prev => [...prev, row])
      setStats(prev   => ({
        total:    prev.total    + 1,
        frauds:   prev.frauds   + (vd === 'fraud'   ? 1 : 0),
        suspects: prev.suspects + (vd === 'suspect' ? 1 : 0),
        normal:   prev.normal   + (vd === 'normal'  ? 1 : 0),
        saved:    prev.saved    + (vd === 'fraud'    ? Math.round(tx.amount) : 0),
      }))
    } finally {
      pending.current = false
    }
  }, [])

  useEffect(() => {
    if (!running) { clearInterval(iv.current); return }
    const ms = speed === 'slow' ? 3000 : speed === 'fast' ? 800 : 1600
    iv.current = setInterval(tick, ms)
    return () => clearInterval(iv.current)
  }, [running, speed, tick])

  return { feed, history, evoData, stats, running, apiStatus, toggle: () => setRunning(v => !v) }
}
