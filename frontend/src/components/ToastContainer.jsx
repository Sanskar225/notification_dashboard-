import { TYPE_ICONS, TYPE_COLORS } from '../utils'

function Toast({ toast, onDismiss }) {
  const color = TYPE_COLORS[toast.type] || TYPE_COLORS.info
  const icon = TYPE_ICONS[toast.type] || '🔔'

  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: 12,
      border: `1px solid ${color}`,
      background: 'rgba(10,10,15,0.94)',
      backdropFilter: 'blur(20px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
      position: 'relative',
      overflow: 'hidden',
      animation: toast.out ? 'toastOut 0.3s ease forwards' : 'toastIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
      maxWidth: 340,
    }}>
      {/* left accent */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: color }} />
      {/* timer bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: color,
        animation: toast.out ? 'none' : 'toastTimer 4.2s linear forwards',
        transformOrigin: 'left',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.63rem',
          textTransform: 'uppercase', letterSpacing: '0.1em', color, fontWeight: 500,
        }}>
          {toast.type}
        </span>
        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0,
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ fontSize: '0.82rem', lineHeight: 1.4, paddingLeft: 2 }}>
        {toast.message}
      </div>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', top: 80, right: 24,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'all' }}>
          <Toast toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
