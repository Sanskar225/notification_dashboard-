/**
 * API Routes
 * REST endpoints for monitoring and control
 * Enhanced with notification history, detailed stats, and room member counts
 */

const express = require('express');
const connectionManager = require('./connectionManager');
const notificationService = require('./notificationService');
const roomManager = require('./roomManager');
const logger = require('./logger');
const { sanitizeMessage, isValidMessage, truncateMessage } = require('./utils');

const router = express.Router();
const MAX_MESSAGE_LENGTH = 200;

// ==================== HEALTH & DASHBOARD ====================

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

// Get detailed stats (enhanced)
router.get('/stats/detailed', (req, res) => {
  res.json({
    connections: connectionManager.getStats(),
    notifications: {
      totalSent: notificationService.getTotalSent(),
      todayCount: notificationService.getTodayCount(),
      lastNotification: notificationService.getLastNotification(),
      scheduledJobs: notificationService.scheduledJobs?.size || 0
    },
    rooms: {
      count: roomManager.getActiveRoomCount(),
      rooms: roomManager.getAllRooms().map(r => ({
        id: r.id,
        name: r.name,
        members: r.memberCount,
        isDefault: r.isDefault || false
      }))
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      pid: process.pid,
      timestamp: new Date().toISOString()
    }
  });
});

// ==================== CONNECTION STATISTICS ====================

// Get active clients
router.get('/clients', (req, res) => {
  res.json({
    count: connectionManager.getActiveCount(),
    clients: connectionManager.getAllClients(),
    totalConnections: connectionManager.getTotalConnections(),
    timestamp: new Date().toISOString()
  });
});

// Get connection stats
router.get('/stats/connections', (req, res) => {
  res.json(connectionManager.getStats());
});

// ==================== NOTIFICATION ENDPOINTS ====================

// Send broadcast notification
router.post('/notify/broadcast', (req, res) => {
  let { message, type = 'broadcast' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  // Validate message
  if (!isValidMessage(message)) {
    return res.status(400).json({ 
      error: 'Message must be between 1 and 200 characters',
      providedLength: message?.length || 0
    });
  }
  
  // Sanitize and truncate
  message = sanitizeMessage(message);
  message = truncateMessage(message, MAX_MESSAGE_LENGTH);
  
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
router.post('/notify/target', async (req, res) => {
  let { userId, message, type = 'targeted' } = req.body;
  
  if (!userId || !message) {
    return res.status(400).json({ error: 'User ID and message required' });
  }
  
  // Validate message
  if (!isValidMessage(message)) {
    return res.status(400).json({ 
      error: 'Message must be between 1 and 200 characters',
      providedLength: message?.length || 0
    });
  }
  
  // Sanitize and truncate
  message = sanitizeMessage(message);
  message = truncateMessage(message, MAX_MESSAGE_LENGTH);
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const success = await notificationService.sendToUser(userId, notification, io);
  
  if (success) {
    res.json({ success: true, notification, target: userId });
  } else {
    res.status(404).json({ error: `User ${userId} not found or not connected` });
  }
});

// Send group notification
router.post('/notify/group', (req, res) => {
  let { roomId, message, type = 'group' } = req.body;
  
  if (!roomId || !message) {
    return res.status(400).json({ error: 'Room ID and message required' });
  }
  
  // Validate room exists
  const room = roomManager.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: `Room ${roomId} does not exist` });
  }
  
  // Validate message
  if (!isValidMessage(message)) {
    return res.status(400).json({ 
      error: 'Message must be between 1 and 200 characters',
      providedLength: message?.length || 0
    });
  }
  
  // Sanitize and truncate
  message = sanitizeMessage(message);
  message = truncateMessage(message, MAX_MESSAGE_LENGTH);
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const count = notificationService.sendToRoom(io, roomId, notification);
  
  res.json({
    success: true,
    notification,
    room: roomId,
    roomName: room.name,
    recipients: count,
    timestamp: new Date().toISOString()
  });
});

// Schedule notification
router.post('/notify/schedule', (req, res) => {
  let { delay, message, type = 'scheduled', targetType, targetId } = req.body;
  
  if (!delay || !message) {
    return res.status(400).json({ error: 'Delay and message required' });
  }
  
  // Validate delay
  if (typeof delay !== 'number' || delay <= 0 || delay > 86400000) {
    return res.status(400).json({ error: 'Delay must be between 1ms and 24 hours' });
  }
  
  // Validate message
  if (!isValidMessage(message)) {
    return res.status(400).json({ 
      error: 'Message must be between 1 and 200 characters',
      providedLength: message?.length || 0
    });
  }
  
  // Sanitize and truncate
  message = sanitizeMessage(message);
  message = truncateMessage(message, MAX_MESSAGE_LENGTH);
  
  // Validate target if it's a room
  if (targetType === 'room' && targetId) {
    const room = roomManager.getRoom(targetId);
    if (!room) {
      return res.status(404).json({ error: `Target room ${targetId} not found` });
    }
  }
  
  const io = req.app.get('io');
  const notification = notificationService.createNotification(message, type, { source: 'api' });
  const jobId = notificationService.scheduleNotification(io, notification, delay, targetType, targetId);
  
  res.json({
    success: true,
    jobId,
    notification,
    deliveryTime: new Date(Date.now() + delay).toISOString(),
    timestamp: new Date().toISOString()
  });
});

// Get notification stats
router.get('/stats/notifications', (req, res) => {
  res.json(notificationService.getStats());
});

// Get notification history (NEW)
router.get('/notifications/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    notifications: notificationService.getNotificationHistory(limit),
    total: notificationService.getTotalSent(),
    timestamp: new Date().toISOString()
  });
});

// ==================== ROOM MANAGEMENT ====================

// Get all rooms (enhanced with member counts)
router.get('/rooms', (req, res) => {
  const rooms = roomManager.getAllRooms();
  
  res.json({
    count: rooms.length,
    rooms: rooms.map(room => ({
      id: room.id,
      name: room.name,
      members: room.memberCount,
      isDefault: room.isDefault || false,
      createdAt: room.createdAt,
      creator: room.creator
    })),
    timestamp: new Date().toISOString()
  });
});

// Create room
router.post('/rooms', (req, res) => {
  let { name, creatorId = 'api' } = req.body;
  
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Room name required' });
  }
  
  // Sanitize room name
  name = sanitizeMessage(name).substring(0, 50);
  
  if (!name || name.length === 0) {
    return res.status(400).json({ error: 'Invalid room name' });
  }
  
  try {
    const roomId = roomManager.createRoom(name, creatorId);
    res.json({
      success: true,
      roomId,
      name,
      creator: creatorId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get room details
router.get('/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = roomManager.getRoom(roomId);
  
  if (room) {
    res.json({
      id: room.id,
      name: room.name,
      memberCount: room.members.size,
      members: Array.from(room.members.values()).map(m => ({
        userId: m.userId,
        joinedAt: m.joinedAt
      })),
      isDefault: room.isDefault || false,
      createdAt: room.createdAt,
      creator: room.creator
    });
  } else {
    res.status(404).json({ error: 'Room not found' });
  }
});

// ==================== EVENT TRIGGERS ====================

// Manual trigger endpoint (for event-based notifications)
router.post('/trigger', (req, res) => {
  let { event, message } = req.body;
  
  if (!event) {
    return res.status(400).json({ error: 'Event name required' });
  }
  
  // Sanitize inputs
  event = sanitizeMessage(event).substring(0, 50);
  
  if (!event) {
    return res.status(400).json({ error: 'Invalid event name' });
  }
  
  if (message) {
    if (!isValidMessage(message)) {
      return res.status(400).json({ error: 'Message too long (max 200 chars)' });
    }
    message = sanitizeMessage(message);
    message = truncateMessage(message, MAX_MESSAGE_LENGTH);
  }
  
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
    notification,
    timestamp: new Date().toISOString()
  });
});

// ==================== TEST & DEBUG ENDPOINTS ====================

// Test endpoint to verify server is working
router.get('/test', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/dashboard',
      '/api/clients',
      '/api/rooms',
      '/api/notify/broadcast',
      '/api/notify/target',
      '/api/notify/group',
      '/api/notify/schedule',
      '/api/trigger',
      '/api/stats/detailed',
      '/api/notifications/history'
    ]
  });
});

module.exports = router;