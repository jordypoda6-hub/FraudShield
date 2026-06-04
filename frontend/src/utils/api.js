import { computeScore, getVerdict } from './engine'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Test si le backend Flask est disponible
export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`, { signal: AbortSignal.timeout(2000) })
    return res.ok
  } catch {
    return false
  }
}

// Prédiction via Flask — fallback sur scoring local si Flask indisponible
export async function predictTransaction(tx) {
  try {
    const res = await fetch(`${API_URL}/predict`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...tx,
        amount: tx.amount,
        hour:   tx.hour,
      }),
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    return {
      score:    data.score,
      proba:    data.proba,
      verdict:  data.verdict,
      source:  'model',
    }
  } catch (err) {
    // ── Fallback local ──────────────────────────────────────────
    // Si Flask n'est pas démarré, on utilise le scoring simulé
    const score   = computeScore(tx)
    const verdict = getVerdict(score)
    return {
      score,
      proba:   score / 100,
      verdict,
      source: 'simulation',
    }
  }
}