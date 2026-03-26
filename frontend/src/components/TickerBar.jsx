import { useEffect, useRef, useState } from 'react'

export default function TickerBar({ notifications }) {
  const [items, setItems] = useState([
    'Real-time WebSocket connection active',
    'Auto-notifications every 10 seconds',
    'Broadcast · Targeted · Group · Scheduled',
    'NexusPulse — Real-Time Notification System',
  ])

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]
      const msg = `[${latest.type.toUpperCase()}] ${latest.message}`
      setItems(prev => [msg, ...prev].slice(0, 12))
    }
  }, [notifications])

  const doubled = [...items, ...items]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 32,
      background: 'rgba(10,10,15,0.85)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center',
      overflow: 'hidden', zIndex: 50,
    }}>
      <div style={{
        padding: '0 16px',
        fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
        letterSpacing: '0.15em', color: 'var(--accent)',
        textTransform: 'uppercase',
        borderRight: '1px solid var(--border)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        ⚡ LIVE
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', gap: 48, animation: 'ticker 25s linear infinite',
          whiteSpace: 'nowrap',
        }}>
          {doubled.map((item, i) => (
            <span key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--text-muted)',
            }}>
              {item} <span style={{ color: 'var(--accent)' }}>●</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
