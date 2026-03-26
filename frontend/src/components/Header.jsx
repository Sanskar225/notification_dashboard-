import { useState, useEffect } from 'react'

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid var(--border)',
    background: 'rgba(10,10,15,0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.2rem',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
    color: 'var(--text)',
  },
  logoIcon: {
    width: 32, height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16,
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
}

const STATUS_CONFIG = {
  connected:    { label: 'LIVE',          dot: '#4ade80', border: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.06)',  anim: 'pulseDot' },
  disconnected: { label: 'OFFLINE',       dot: '#f87171', border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.06)', anim: 'none' },
  reconnecting: { label: 'RECONNECTING…', dot: '#fbbf24', border: 'rgba(251,191,36,0.3)',  bg: 'rgba(251,191,36,0.06)',  anim: 'blink' },
}

export default function Header({ status, myUserId }) {
  const [copied, setCopied] = useState(false)
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected

  const copyId = () => {
    if (!myUserId) return
    navigator.clipboard.writeText(myUserId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.logoIcon}>⚡</div>
        <span>Nexus<span style={{ color: 'var(--accent)' }}>Pulse</span></span>
      </div>

      <div style={styles.right}>
        {/* Connection badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', borderRadius: 100,
          border: `1px solid ${cfg.border}`,
          background: cfg.bg,
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.06em',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: cfg.dot, flexShrink: 0,
            animation: `${cfg.anim} 2s infinite`,
            boxShadow: status === 'connected' ? `0 0 8px ${cfg.dot}` : 'none',
          }} />
          {cfg.label}
        </div>

        {/* User ID pill */}
        {myUserId && (
          <button
            onClick={copyId}
            title="Click to copy your User ID"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: copied ? 'var(--green)' : 'var(--text-dim)',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 11px',
              maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              cursor: 'pointer', transition: 'color 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : myUserId}
          </button>
        )}
      </div>
    </header>
  )
}
