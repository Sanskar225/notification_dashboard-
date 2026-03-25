/**
 * API Routes
 * REST endpoints for monitoring and control
 */

const express = require('express');
const connectionManager = require('./connectionManager');
const notificationService = require('./notificationService');
const roomManager = require('./roomManager');
const logger = require('./logger');

const router = express.Router();

// Get complete dashboard stats
router.get('/dashboard', (req, res) => {
  res.json({
    connections: connectionManager.getStats(),
    notifications: notificationService.getStats(),
    rooms: {
      count: roomManager.getActiveRoomCount(),
      list: roomManager.getAllRooms()
    },
    timestamp: new Date().toISOString()
  });
});

// Get active clients
router.get('/clients', (req, res) => {
  res.json({
    count: connectionManager.getActiveCount(),
    clients: connectionManager.getAllClients(),
    totalConnections: connectionManager.getTotalConnections()
  });
});

// Send broadcast notification
router.post('/notify/broadcast', (req, res) => {
  const { message, type = 'broadcast' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const count = notificationService.broadcastToAll(io, notification);
  
  res.json({
    success: true,
    notification,
    recipients: count,
    timestamp: new Date().toISOString()
  });
});

// Send targeted notification
router.post('/notify/target', (req, res) => {
  const { userId, message, type = 'targeted' } = req.body;
  
  if (!userId || !message) {
    return res.status(400).json({ error: 'User ID and message required' });
  }
  
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const success = notificationService.sendToUser(userId, notification);
  
  if (success) {
    res.json({ success: true, notification, target: userId });
  } else {
    res.status(404).json({ error: `User ${userId} not found` });
  }
});

// Send group notification
router.post('/notify/group', (req, res) => {
  const { roomId, message, type = 'group' } = req.body;
  
  if (!roomId || !message) {
    return res.status(400).json({ error: 'Room ID and message required' });
  }
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const count = notificationService.sendToRoom(io, roomId, notification);
  
  res.json({
    success: true,
    notification,
    room: roomId,
    recipients: count
  });
});

// Schedule notification
router.post('/notify/schedule', (req, res) => {
  const { delay, message, type = 'scheduled', targetType, targetId } = req.body;
  
  if (!delay || !message) {
    return res.status(400).json({ error: 'Delay and message required' });
  }
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const jobId = notificationService.scheduleNotification(io, notification, delay, targetType, targetId);
  
  res.json({
    success: true,
    jobId,
    notification,
    deliveryTime: new Date(Date.now() + delay).toISOString()
  });
});

// Get all rooms
router.get('/rooms', (req, res) => {
  res.json({
    count: roomManager.getActiveRoomCount(),
    rooms: roomManager.getAllRooms()
  });
});

// Create room
router.post('/rooms', (req, res) => {
  const { name, creatorId = 'api' } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Room name required' });
  }
  
  const roomId = roomManager.createRoom(name, creatorId);
  
  res.json({
    success: true,
    roomId,
    name,
    creator: creatorId
  });
});

// Get room details
router.get('/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  
  if (room) {
    res.json({
      id: room.id,
      name: room.name,
      memberCount: room.members.size,
      members: Array.from(room.members.values())
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// Get notification stats
router.get('/stats/notifications', (req, res) => {
  res.json(notificationService.getStats());
});

// Get connection stats
router.get('/stats/connections', (req, res) => {
  res.json(connectionManager.getStats());
});

// Manual trigger endpoint (for event-based notifications)
router.post('/trigger', (req, res) => {
  const { event, message } = req.body;
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(
    message || `Event "${event}" triggered`,
    'event_triggered',
    { event, source: 'api' }
  );
  
  notificationService.broadcastToAll(io, notification);
  
  res.json({
    success: true,
    event,
    notification
  });
});

module.exports = router;