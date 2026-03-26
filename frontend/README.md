# ⚡ NexusPulse — Real-Time Notification System

A full-stack real-time notification system built with **Node.js + Socket.IO** (backend) and **React + Vite** (frontend), featuring a stunning Vanta.js globe background.

---

## 📁 Project Structure

```
project-root/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── server.js
│   │   ├── socket.js
│   │   ├── connectionManager.js
│   │   ├── notificationService.js
│   │   ├── roomManager.js
│   │   ├── routes.js
│   │   ├── logger.js
│   │   └── utils.js
│   └── package.json
│
└── frontend/                  ← This React app
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── utils.js
    │   ├── components/
    │   │   ├── VantaBackground.jsx
    │   │   ├── Header.jsx
    │   │   ├── StatCard.jsx
    │   │   ├── Panel.jsx
    │   │   ├── SendPanel.jsx
    │   │   ├── NotificationFeed.jsx
    │   │   ├── RoomsPanel.jsx
    │   │   ├── ClientsPanel.jsx
    │   │   ├── ToastContainer.jsx
    │   │   └── TickerBar.jsx
    │   ├── hooks/
    │   │   ├── useSocket.js
    │   │   └── useStats.js
    │   └── styles/
    │       └── globals.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Running the Project

### 1. Start the Backend

```bash
cd backend
npm install
npm run dev       # development with nodemon
# or
npm start         # production
```

The backend runs on **http://localhost:3000**

### 2. Start the Frontend (Development)

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on **http://localhost:5173**  
It proxies `/api`, `/health`, and `/socket.io` to the backend automatically.

### 3. Build Frontend for Production

```bash
cd frontend
npm run build
```

This outputs the built files to `../client/` — which the backend serves directly via `express.static`. After building, just visit **http://localhost:3000** for the full app.

---

## 🔌 Real-Time Method: WebSockets via Socket.IO

**Why WebSockets over SSE?**

| Feature | WebSockets | SSE |
|---|---|---|
| Direction | Bidirectional | Server → Client only |
| Protocol | ws:// / wss:// | HTTP |
| Use case | Chat, notifications, live dashboards | News feeds, stock tickers |
| Reconnection | Built-in with Socket.IO | Manual |

WebSockets were chosen because the system needs **bidirectional communication** — clients don't just receive notifications, they also send them (broadcast, targeted, group, scheduled). SSE only supports one direction.

Socket.IO adds:
- Automatic reconnection with exponential backoff
- Fallback to HTTP long-polling when WebSocket is blocked
- Room-based pub/sub for group notifications
- Heartbeat/ping-pong to detect stale connections

---

## 📡 How Real-Time Communication Works

### Connection Flow
```
Client connects
    └─► Socket.IO handshake (WebSocket upgrade)
    └─► Server assigns unique USER_id
    └─► Client auto-joins "general" room
    └─► Server sends `welcome` event with userId + room list
    └─► Server broadcasts `clients-update` to all
```

### Notification Flow
```
Auto (every 10s):  Server ──► io.emit('notification') ──► ALL clients
Broadcast:         Client ──► socket.emit('send-broadcast') ──► Server ──► ALL clients
Targeted:          Client ──► socket.emit('send-targeted', {userId}) ──► Server ──► ONE client
Group:             Client ──► socket.emit('send-to-group', {roomId}) ──► Server ──► ROOM members
Scheduled:         Client ──► socket.emit('schedule-notification', {delay}) ──► Server setTimeout ──► broadcast
Event:             Client ──► socket.emit('trigger-event', {eventName}) ──► Server ──► ALL clients
```

### Connection Tracking
- `ConnectionManager` keeps a `Map<socketId, clientObject>` of all active clients
- On every connect/disconnect, `io.emit('clients-update', { count, clients })` fires to all
- Frontend `useSocket` hook listens and updates the `activeClients` state
- Idle connections (>5 min inactive) are cleaned up by a background task
- Peak connection count is tracked in stats

### Disconnect Handling
```
Client disconnects
    └─► 'disconnect' event fires on server
    └─► ConnectionManager.removeClient(socketId)
    └─► RoomManager.removeClientFromAllRooms(socketId)
    └─► io.emit('clients-update') → all clients update their count
    └─► Socket.IO client-side auto-reconnects with backoff
    └─► On reconnect: new userId assigned, re-joins general room
```

---

## 🎨 Frontend Architecture

- **`useSocket.js`** — All Socket.IO logic, event listeners, state management
- **`useStats.js`** — Polls `/api/stats/detailed` every 15s for server metrics
- **`VantaBackground`** — Vanta.js globe (three.js) with warm gold color scheme
- **`SendPanel`** — Dynamic form that adapts fields based on notification type
- **`NotificationFeed`** — Live scrolling feed with filter tabs per type
- **`RoomsPanel`** — Create/join/leave rooms, send group messages
- **`ClientsPanel`** — Live list of connected users with timestamps
- **`ToastContainer`** — Stacked toast notifications with timer bar + animations
- **`TickerBar`** — Bottom scrolling ticker showing latest events

---

## 🔧 Potential Improvements (With More Time)

1. **Authentication** — JWT tokens so users have persistent identities across reconnects
2. **Notification persistence** — Store notifications in MongoDB/Redis so history survives server restarts
3. **Read receipts** — Track which users have seen which notifications
4. **Notification preferences** — Users opt-in/out of specific notification types
5. **Admin dashboard** — Separate view with charts (D3/Recharts) for notification analytics
6. **Rate limiting** — Per-user throttle to prevent notification spam
7. **End-to-end encryption** — For targeted (private) messages
8. **Mobile push** — Integrate with Firebase Cloud Messaging for offline delivery
9. **Webhook support** — Allow external services to POST to `/api/notify/broadcast`
10. **TypeScript migration** — Full type safety across frontend + backend

---

## 🌐 Environment Variables (Backend)

Create `backend/.env`:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=*
AUTO_NOTIFICATION_INTERVAL=10000
ENABLE_AUTO_NOTIFICATIONS=true
PING_INTERVAL=25000
PING_TIMEOUT=60000
```
