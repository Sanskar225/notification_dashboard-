import { useState } from 'react'
import Panel from './Panel'

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  fontFamily: 'var(--font-body)',
  fontSize: '0.85rem',
  padding: '9px 12px',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.67rem', letterSpacing: '0.09em',
  textTransform: 'uppercase', color: 'var(--text-dim)',
  marginBottom: 6,
}

function FormGroup({ label, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function StyledInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? { borderColor: 'var(--accent)', background: 'rgba(200,181,96,0.05)' } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function StyledSelect({ children, style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        cursor: 'pointer',
        ...(focused ? { borderColor: 'var(--accent)', background: 'rgba(200,181,96,0.05)' } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      {children}
    </select>
  )
}

const QUICK_EVENTS = [
  { event: 'user_joined',  message: '🔔 New user joined the platform!', label: 'user_joined' },
  { event: 'alert',        message: '⚠️ System alert triggered',         label: 'alert' },
  { event: 'deploy',       message: '🚀 Deployment completed',           label: 'deploy' },
  { event: 'backup',       message: '💾 Backup finished successfully',   label: 'backup' },
]

export default function SendPanel({ emit, rooms }) {
  const [type, setType]       = useState('broadcast')
  const [message, setMessage] = useState('')
  const [style, setStyle]     = useState('info')
  const [targetUser, setTargetUser] = useState('')
  const [targetRoom, setTargetRoom] = useState('general')
  const [delay, setDelay]     = useState(5000)
  const [eventName, setEventName] = useState('')

  const charLen = message.length
  const counterColor = charLen > 180 ? 'var(--red)' : charLen > 150 ? 'var(--yellow)' : 'var(--text-muted)'

  const send = () => {
    if (!message.trim()) return

    if (type === 'broadcast') {
      emit('send-broadcast', { message: message.trim(), type: style })
    } else if (type === 'targeted') {
      if (!targetUser.trim()) return
      emit('send-targeted', { targetUserId: targetUser.trim(), message: message.trim(), type: 'targeted' })
    } else if (type === 'group') {
      emit('send-to-group', { roomId: targetRoom, message: message.trim(), type: style })
    } else if (type === 'scheduled') {
      const d = parseInt(delay)
      if (!d || d < 100) return
      emit('schedule-notification', { delay: d, message: message.trim(), type: 'scheduled', targetType: 'broadcast' })
    } else if (type === 'event') {
      if (!eventName.trim()) return
      emit('trigger-event', { eventName: eventName.trim(), message: message.trim() })
    }

    setMessage('')
  }

  const quickTrigger = ({ event, message: msg }) => {
    emit('trigger-event', { eventName: event, message: msg })
  }

  return (
    <Panel title="Send Notification" icon="📤">
      <FormGroup label="Type">
        <StyledSelect value={type} onChange={e => setType(e.target.value)}>
          <option value="broadcast">📡 Broadcast — All Users</option>
          <option value="targeted">🎯 Targeted — Specific User</option>
          <option value="group">👥 Group — Room</option>
          <option value="scheduled">⏰ Scheduled — Delayed</option>
          <option value="event">⚡ Event Trigger</option>
        </StyledSelect>
      </FormGroup>

      {type === 'targeted' && (
        <FormGroup label="Target User ID">
          <StyledInput
            value={targetUser}
            onChange={e => setTargetUser(e.target.value)}
            placeholder="USER_1234567890_abc..."
          />
        </FormGroup>
      )}

      {type === 'group' && (
        <FormGroup label="Target Room">
          <StyledSelect value={targetRoom} onChange={e => setTargetRoom(e.target.value)}>
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.isDefault ? '🏠' : '💬'} {r.name}</option>
            ))}
          </StyledSelect>
        </FormGroup>
      )}

      {type === 'scheduled' && (
        <FormGroup label="Delay (ms)">
          <StyledInput
            type="number" value={delay} min={100} max={86400000}
            onChange={e => setDelay(e.target.value)}
            placeholder="5000"
          />
        </FormGroup>
      )}

      {type === 'event' && (
        <FormGroup label="Event Name">
          <StyledInput
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            placeholder="user_joined, deploy, alert…"
          />
        </FormGroup>
      )}

      <FormGroup label="Message">
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          maxLength={200}
          placeholder="Type your notification message…"
          style={{
            ...inputStyle,
            resize: 'none',
            height: 80,
            lineHeight: 1.5,
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.background = 'rgba(200,181,96,0.05)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'rgba(255,255,255,0.04)' }}
        />
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: counterColor, marginTop: 3 }}>
          {charLen} / 200
        </div>
      </FormGroup>

      {(type === 'broadcast' || type === 'group') && (
        <FormGroup label="Style">
          <StyledSelect value={style} onChange={e => setStyle(e.target.value)}>
            <option value="info">ℹ️ Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="error">❌ Error</option>
          </StyledSelect>
        </FormGroup>
      )}

      <button
        onClick={send}
        style={{
          width: '100%', padding: '10px 16px',
          border: 'none', borderRadius: 8,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          color: '#0a0a0f',
          fontFamily: 'var(--font-display)', fontWeight: 700,
          fontSize: '0.82rem', letterSpacing: '0.05em',
          cursor: 'pointer', transition: 'all 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(200,181,96,0.3)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
      >
        ⚡ Send Notification
      </button>

      {/* Quick triggers */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
          Quick Triggers
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {QUICK_EVENTS.map(qe => (
            <button
              key={qe.event}
              onClick={() => quickTrigger(qe)}
              style={{
                padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 7,
                background: 'var(--surface)', color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', fontSize: '0.67rem', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-dim)' }}
            >
              {qe.label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
