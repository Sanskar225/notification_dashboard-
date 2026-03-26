import { useState } from 'react'
import Panel from './Panel'

function RoomRow({ room, inRoom, onJoin, onLeave, onMsg }) {
  const [showMsgInput, setShowMsgInput] = useState(false)
  const [message, setMessage] = useState('')

  const handleSendMsg = () => {
    if (message.trim()) {
      onMsg(message.trim())
      setMessage('')
      setShowMsgInput(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMsg()
    }
    if (e.key === 'Escape') {
      setShowMsgInput(false)
      setMessage('')
    }
  }

  return (
    <div>
      <div style={{
        padding: '10px 12px', borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
        marginBottom: showMsgInput ? 0 : 6,
        transition: 'all 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>{room.isDefault ? '🏠' : '💬'}</span>
          <span style={{ fontWeight: 500, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {room.name}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.63rem', color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.05)', padding: '2px 7px', borderRadius: 4, flexShrink: 0,
          }}>
            {room.memberCount || 0}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {!room.isDefault && (
            inRoom
              ? <MiniBtn color="var(--red)" border="rgba(248,113,113,0.3)" onClick={onLeave}>Leave</MiniBtn>
              : <MiniBtn color="var(--green)" border="rgba(74,222,128,0.3)" onClick={onJoin}>Join</MiniBtn>
          )}
          <MiniBtn 
            color="var(--accent)" 
            border="rgba(200,181,96,0.3)" 
            onClick={() => setShowMsgInput(!showMsgInput)}
            active={showMsgInput}
          >
            {showMsgInput ? '✕' : '💬'}
          </MiniBtn>
        </div>
      </div>
      
      {/* Message input area */}
      {showMsgInput && (
        <div style={{
          marginBottom: 6,
          padding: '10px 12px',
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '0 0 8px 8px',
          border: '1px solid var(--border)',
          borderTop: 'none',
          animation: 'slideDown 0.2s ease-out',
        }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message #${room.name}...`}
                rows={2}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.82rem',
                  padding: '8px 12px',
                  outline: 'none',
                  resize: 'vertical',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--accent)' }}
                onBlur={(e) => { e.target.style.borderColor = 'var(--border)' }}
                autoFocus
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 6,
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                <span>Press Enter to send • Escape to cancel</span>
                <span>{message.length}/500</span>
              </div>
            </div>
            <button
              onClick={handleSendMsg}
              disabled={!message.trim()}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 8,
                background: message.trim() 
                  ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                  : 'rgba(255,255,255,0.1)',
                color: message.trim() ? '#0a0a0f' : 'var(--text-muted)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: message.trim() ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (message.trim()) e.currentTarget.style.opacity = '0.85'
              }}
              onMouseLeave={(e) => {
                if (message.trim()) e.currentTarget.style.opacity = '1'
              }}
            >
              Send →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniBtn({ children, color, border, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 9px', borderRadius: 5, border: `1px solid ${active ? color : border}`,
        background: active ? `rgba(${color},0.15)` : 'transparent',
        color: active ? color : color,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.63rem', cursor: 'pointer', transition: 'all 0.15s',
        display: 'flex', alignItems: 'center', gap: 4,
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = `rgba(${color},0.08)`
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

export default function RoomsPanel({ rooms, joinedRooms, emit, addToast }) {
  const [newName, setNewName] = useState('')

  const createRoom = () => {
    const name = newName.trim()
    if (!name) return
    emit('create-room', name)
    setNewName('')
    if (addToast) addToast(`Creating room "${name}"...`, 'info')
  }

  const sendMsg = (room, message) => {
    emit('send-to-group', { 
      roomId: room.id, 
      message: message, 
      type: 'group' 
    })
    if (addToast) addToast(`Message sent to #${room.name}`, 'success')
  }

  return (
    <Panel
      title="Rooms"
      icon="🏠"
      headerRight={
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4,
        }}>
          {rooms.length}
        </span>
      }
    >
      {/* create room row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && createRoom()}
          placeholder="New room name…"
          maxLength={50}
          style={{
            flex: 1, background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '0.82rem',
            padding: '8px 12px', outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--accent)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <button
          onClick={createRoom}
          style={{
            padding: '8px 14px', border: 'none', borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#0a0a0f', fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.opacity = '0.9'
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.opacity = '1'
          }}
        >
          <span>+</span> Create
        </button>
      </div>

      {/* Rooms list with scroll */}
      <div style={{
        maxHeight: 'calc(100vh - 380px)',
        minHeight: '300px',
        overflowY: 'auto',
        paddingRight: 4,
      }}>
        {rooms.length === 0 ? (
          <div style={{ 
            color: 'var(--text-muted)', fontSize: '0.78rem', 
            textAlign: 'center', padding: '40px 20px',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: '2rem', opacity: 0.3 }}>🏠</span>
            <div>No rooms available</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              Create your first room above
            </div>
          </div>
        ) : (
          rooms.map(room => (
            <RoomRow
              key={room.id}
              room={room}
              inRoom={joinedRooms.has(room.id)}
              onJoin={() => emit('join-room', room.id)}
              onLeave={() => emit('leave-room', room.id)}
              onMsg={(message) => sendMsg(room, message)}
            />
          ))
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Panel>
  )
}