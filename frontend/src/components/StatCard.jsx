import { useEffect, useRef } from 'react'

export default function StatCard({ label, value, sub, accentColor = 'var(--accent)' }) {
  const valRef = useRef(null)
  const prevVal = useRef(value)

  useEffect(() => {
    if (prevVal.current !== value && valRef.current) {
      valRef.current.style.animation = 'none'
      void valRef.current.offsetWidth
      valRef.current.style.animation = 'flashVal 0.5s ease'
    }
    prevVal.current = value
  }, [value])

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '18px 20px',
      backdropFilter: 'blur(12px)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.3s, background 0.3s',
      cursor: 'default',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
    >
      {/* top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
        opacity: 0.65,
      }} />
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.68rem', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8,
      }}>{label}</div>
      <div ref={valRef} style={{
        fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700,
        lineHeight: 1, transition: 'color 0.3s',
      }}>{value}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 5 }}>{sub}</div>}
    </div>
  )
}
