import Panel from './Panel'
import { timeAgo } from '../utils'

export default function ClientsPanel({ clientList, myUserId }) {
  return (
    <Panel
      title="Connected Users"
      icon="👤"
      headerRight={
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4,
        }}>
          {clientList.length}
        </span>
      }
    >
      {clientList.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
          No users connected
        </div>
      ) : (
        clientList.map(client => (
          <div key={client.userId} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            border: '1px solid var(--border)',
            background: client.userId === myUserId ? 'rgba(200,181,96,0.04)' : 'rgba(255,255,255,0.02)',
            marginBottom: 5,
            borderColor: client.userId === myUserId ? 'rgba(200,181,96,0.2)' : 'var(--border)',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green)', flexShrink: 0,
              boxShadow: '0 0 6px var(--green)',
            }} />
            <span style={{
              flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.65rem',
              color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {client.userId}
              {client.userId === myUserId && (
                <span style={{ color: 'var(--accent)', marginLeft: 5 }}>you</span>
              )}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              {timeAgo(client.connectedAt)}
            </span>
          </div>
        ))
      )}
    </Panel>
  )
}