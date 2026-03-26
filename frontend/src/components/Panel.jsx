export default function Panel({ title, icon, headerRight, children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(10,10,15,0.75)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      ...style,
    }}>
      {/* header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '0.82rem', letterSpacing: '0.06em', textTransform: 'uppercase',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
          {title}
        </div>
        {headerRight}
      </div>

      {/* body */}
      <div style={{
        flex: 1, padding: 16, overflowY: 'auto', overflowX: 'hidden',
      }}>
        {children}
      </div>
    </div>
  )
}
