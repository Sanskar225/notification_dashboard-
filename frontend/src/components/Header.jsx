import { useState, useEffect } from 'react'

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 32px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(10,10,15,0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    transition: 'all 0.3s ease',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1.3rem',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
    color: 'var(--text)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  logoIcon: {
    width: 36, height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, var(--accent), #e6b422)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
    boxShadow: '0 2px 12px rgba(200,181,96,0.3)',
    transition: 'all 0.2s ease',
  },
  right: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16,
  },
}

const STATUS_CONFIG = {
  connected:    { 
    label: 'LIVE',          
    dot: '#4ade80', 
    border: 'rgba(74,222,128,0.5)',  
    bg: 'rgba(74,222,128,0.08)',  
    anim: 'pulseDot',
    glow: '0 0 12px rgba(74,222,128,0.4)',
  },
  disconnected: { 
    label: 'OFFLINE',       
    dot: '#f87171', 
    border: 'rgba(248,113,113,0.3)', 
    bg: 'rgba(248,113,113,0.05)', 
    anim: 'none',
    glow: 'none',
  },
  reconnecting: { 
    label: 'RECONNECTING', 
    dot: '#fbbf24', 
    border: 'rgba(251,191,36,0.4)',  
    bg: 'rgba(251,191,36,0.08)',  
    anim: 'blink',
    glow: '0 0 8px rgba(251,191,36,0.4)',
  },
}

export default function Header({ status, myUserId }) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected

  const copyId = () => {
    if (!myUserId) return
    navigator.clipboard.writeText(myUserId)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header style={styles.header}>
      <div 
        style={styles.logo}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)'
          e.currentTarget.querySelector('.logo-icon').style.transform = 'rotate(5deg)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.querySelector('.logo-icon').style.transform = 'rotate(0deg)'
        }}
      >
        <div className="logo-icon" style={{
          ...styles.logoIcon,
          transition: 'transform 0.2s ease',
        }}>⚡</div>
        <span>
          Nexus<span style={{ 
            background: 'linear-gradient(135deg, var(--accent), #e6b422)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}>Pulse</span>
        </span>
      </div>

      <div style={styles.right}>
        {/* Connection badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '7px 16px', borderRadius: 100,
          border: `1px solid ${cfg.border}`,
          background: cfg.bg,
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.7rem', 
          fontWeight: 600,
          letterSpacing: '0.08em',
          backdropFilter: 'blur(8px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated background effect */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(circle at 30% 50%, ${cfg.dot}10, transparent)`,
            opacity: 0.5,
          }} />
          
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: cfg.dot, 
            flexShrink: 0,
            animation: `${cfg.anim} 2s infinite`,
            boxShadow: cfg.glow,
            position: 'relative',
            zIndex: 1,
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>
            {cfg.label}
          </span>
        </div>

        {/* User ID pill */}
        {myUserId && (
          <button
            onClick={copyId}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Click to copy your User ID"
            style={{
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.7rem',
              fontWeight: 500,
              color: copied ? '#4ade80' : hovered ? 'var(--accent)' : 'var(--text-dim)',
              background: hovered ? 'rgba(200,181,96,0.08)' : 'rgba(20,20,25,0.9)',
              border: `1px solid ${hovered ? 'rgba(200,181,96,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 100, 
              padding: '7px 18px',
              maxWidth: 220, 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              cursor: 'pointer', 
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{
              fontSize: '0.75rem',
              transition: 'transform 0.2s ease',
              transform: hovered ? 'scale(1.1)' : 'scale(1)',
            }}>
              {copied ? '✓' : '📋'}
            </span>
            <span style={{ 
              letterSpacing: '0.3px',
            }}>
              {copied ? 'Copied!' : myUserId}
            </span>
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes pulseDot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        /* Optional: Add hover animation for logo */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-2px);
          }
        }
        
        .logo-icon {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </header>
  )
}