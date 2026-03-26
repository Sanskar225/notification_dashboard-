import { useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || window.location.origin

export function useSocket() {
  const socketRef = useRef(null)
  const [status, setStatus] = useState('disconnected') // connected | disconnected | reconnecting
  const [myUserId, setMyUserId] = useState(null)
  const [activeClients, setActiveClients] = useState(0)
  const [clientList, setClientList] = useState([])
  const [rooms, setRooms] = useState([])
  const [joinedRooms, setJoinedRooms] = useState(new Set(['general']))
  const [notifications, setNotifications] = useState([])
  const [totalSent, setTotalSent] = useState(0)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [{ id, message, type }, ...prev].slice(0, 5))
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
    }, 4200)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 320)
  }, [])

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    })
    socketRef.current = socket

    socket.on('connect', () => setStatus('connected'))
    socket.on('disconnect', () => {
      setStatus('disconnected')
      addToast('Connection lost — reconnecting…', 'error')
    })
    socket.on('connect_error', () => setStatus('disconnected'))
    socket.on('reconnecting', () => setStatus('reconnecting'))
    socket.on('reconnect', () => {
      setStatus('connected')
      addToast('Reconnected to server!', 'success')
    })

    socket.on('welcome', (data) => {
      setMyUserId(data.userId)
      setActiveClients(data.activeClients)
    })

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 100))
      setTotalSent(prev => prev + 1)
      addToast(notif.message, notif.type)
    })

    socket.on('clients-update', (data) => {
      setActiveClients(data.count)
      setClientList(data.clients || [])
    })

    socket.on('rooms-list', (data) => {
      setRooms(data.rooms || [])
    })

    socket.on('room-joined', (data) => {
      setJoinedRooms(prev => new Set([...prev, data.roomId]))
      addToast(`Joined room: ${data.roomName}`, 'success')
      socket.emit('get-rooms')
    })

    socket.on('room-left', (data) => {
      setJoinedRooms(prev => { const s = new Set(prev); s.delete(data.roomId); return s })
      socket.emit('get-rooms')
    })

    socket.on('room-created', (data) => {
      addToast(`Room created: ${data.roomName}`, 'success')
      socket.emit('get-rooms')
    })

    socket.on('room-users-update', () => {
      socket.emit('get-rooms')
    })

    socket.on('notification-sent', (data) => {
      if (data.success) addToast(`Notification sent (${data.type})`, 'success')
    })

    socket.on('notification-scheduled', (data) => {
      if (data.success) addToast(`Scheduled for ${new Date(data.deliveryTime).toLocaleTimeString()}`, 'success')
    })

    socket.on('event-triggered', (data) => {
      if (data.success) addToast(`Event "${data.event}" triggered`, 'success')
    })

    socket.on('error', (data) => {
      addToast(data.message, 'error')
    })

    // ping keepalive
    const pingInterval = setInterval(() => {
      if (socket.connected) socket.emit('ping')
    }, 25000)

    return () => {
      clearInterval(pingInterval)
      socket.disconnect()
    }
  }, [addToast])

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      addToast('Not connected to server', 'error')
    }
  }, [addToast])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    socket: socketRef.current,
    status,
    myUserId,
    activeClients,
    clientList,
    rooms,
    joinedRooms,
    notifications,
    totalSent,
    toasts,
    addToast,
    dismissToast,
    emit,
    clearNotifications,
  }
}
