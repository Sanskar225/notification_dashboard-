import { useState } from 'react'
import Panel from './Panel'

function RoomRow({ room, inRoom, onJoin, onLeave, onMsg }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      border: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.02)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      marginBottom: 6, transition: 'all 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-bright)' }}
    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span>{room.isDefault ? '🏠' : '💬'}</span>
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
        <MiniBtn color="var(--accent)" border="rgba(200,181,96,0.3)" onClick={onMsg}>Msg</MiniBtn>
      </div>
    </div>
  )
}

function MiniBtn({ children, color, border, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 9px', borderRadius: 5, border: `1px solid ${border}`,
        background: 'transparent', color, fontFamily: 'var(--font-mono)',
        fontSize: '0.63rem', cursor: 'pointer', transition: 'background 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = `rgba(${color},0.08)`}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
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
  }

  const sendMsg = (room) => {
    const msg = window.prompt(`Message to #${room.name}:`)
    if (msg?.trim()) emit('send-to-group', { roomId: room.id, message: msg.trim(), type: 'group' })
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
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
            padding: '8px 12px', outline: 'none',
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
            fontSize: '1rem', cursor: 'pointer', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          +
        </button>
      </div>

      {rooms.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
          Loading rooms…
        </div>
      ) : (
        rooms.map(room => (
          <RoomRow
            key={room.id}
            room={room}
            inRoom={joinedRooms.has(room.id)}
            onJoin={() => emit('join-room', room.id)}
            onLeave={() => emit('leave-room', room.id)}
            onMsg={() => sendMsg(room)}
          />
        ))
      )}
    </Panel>
  )
}
