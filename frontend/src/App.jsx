import VantaBackground from './components/VantaBackground'
import Header from './components/Header'
import StatCard from './components/StatCard'
import SendPanel from './components/SendPanel'
import NotificationFeed from './components/NotificationFeed'
import RoomsPanel from './components/RoomsPanel'
import ClientsPanel from './components/ClientsPanel'
import ToastContainer from './components/ToastContainer'
import TickerBar from './components/TickerBar'
import { useSocket } from './hooks/useSocket'
import { useStats } from './hooks/useStats'

export default function App() {
  const {
    status, myUserId, activeClients, clientList,
    rooms, joinedRooms, notifications, toasts,
    dismissToast, emit, addToast, clearNotifications,
  } = useSocket()

  const { stats, uptimeDisplay } = useStats()

  return (
    <>
      <VantaBackground />

      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        paddingBottom: 32,
      }}>
        <Header status={status} myUserId={myUserId} />

        <main style={{
          flex: 1,
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: 'clamp(220px,22vw,280px) 1fr clamp(260px,22vw,310px)',
          gridTemplateRows: 'auto minmax(0,1fr)',
          gap: 14,
          maxWidth: 1600,
          width: '100%',
          margin: '0 auto',
          minHeight: 0,
        }}>

          {/* STATS */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
            <StatCard label="Active Users"  value={activeClients}               sub="Live connections"   accentColor="var(--green)"  />
            <StatCard label="Total Sent"    value={stats.totalSent}             sub={`${stats.todayCount} today`} accentColor="var(--accent)" />
            <StatCard label="Server Uptime" value={uptimeDisplay}               sub="Since last restart" accentColor="var(--blue)"   />
            <StatCard label="Active Rooms"  value={stats.activeRooms || rooms.length} sub="Channels"    accentColor="var(--purple)" />
          </div>

          {/* LEFT */}
          <div style={{ gridRow: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SendPanel emit={emit} rooms={rooms} />
          </div>

          {/* MIDDLE */}
          <div style={{ gridRow: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <NotificationFeed notifications={notifications} onClear={clearNotifications} />
          </div>

          {/* RIGHT */}
          <div style={{ gridRow: 2, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden', minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <RoomsPanel rooms={rooms} joinedRooms={joinedRooms} emit={emit} addToast={addToast} />
            </div>
            <div style={{ flexShrink: 0, maxHeight: 260, display: 'flex', flexDirection: 'column' }}>
              <ClientsPanel clientList={clientList} myUserId={myUserId} />
            </div>
          </div>

        </main>
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <TickerBar notifications={notifications} />
    </>
  )
}
