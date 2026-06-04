import React from 'react'

export default function ConnectionBadge({ status }) {
  const cfg = {
    checking:  { color: 'var(--t3)',   bg: 'var(--s3)',       border: 'var(--b2)',       dot: 'var(--t3)',   label: 'Connexion…' },
    connected: { color: 'var(--green)', bg: 'var(--green-dim)', border: 'var(--green-b)', dot: 'var(--green)', label: 'Modèle RF actif' },
    offline:   { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'var(--amber-b)', dot: 'var(--amber)', label: 'Mode simulation' },
  }[status] || {}

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: '99px', padding: '3px 10px',
      fontSize: '11px', fontWeight: 500, color: cfg.color,
    }}>
      <div style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: cfg.dot,
        animation: status === 'connected' ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }}/>
      {cfg.label}
      {status === 'offline' && (
        <span style={{ fontSize: '10px', color: 'var(--t4)', marginLeft: '2px' }}>
          (Flask non démarré)
        </span>
      )}
    </div>
  )
}
