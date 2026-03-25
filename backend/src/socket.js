/**
 * Socket.IO Event Handlers
 * Manages all WebSocket events and notifications
 */

const connectionManager = require('./connectionManager');
const notificationService = require('./notificationService');
const roomManager = require('./roomManager');
const logger = require('./logger');

const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  BROADCAST: 'broadcast',
  TARGETED: 'targeted',
  GROUP: 'group',
  SCHEDULED: 'scheduled',
  EVENT_TRIGGERED: 'event_triggered'
};

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Add client to tracking
    const client = connectionManager.addClient(socket);
    
    logger.info(`✅ Client connected: ${client.userId} (${socket.id})`);
    
    // Send initial data to client
    socket.emit('welcome', {
      userId: client.userId,
      activeClients: connectionManager.getActiveCount(),
      serverTime: new Date().toISOString(),
      notificationTypes: NOTIFICATION_TYPES
    });
    
    // Send current room list
    socket.emit('rooms-list', {
      rooms: roomManager.getAllRooms()
    });
    
    // Broadcast updated client count to everyone
    io.emit('clients-update', {
      count: connectionManager.getActiveCount(),
      clients: connectionManager.getAllClients(),
      timestamp: new Date().toISOString()
    });
    
    // ========== NOTIFICATION HANDLERS ==========
    
    // 1. Broadcast Notification (Send to all)
    socket.on('send-broadcast', (data) => {
      const { message, type = NOTIFICATION_TYPES.BROADCAST } = data;
      
      if (!message) {
        socket.emit('error', { message: 'Message is required' });
        return;
      }
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, broadcast: true }
      );
      
      notificationService.broadcastToAll(io, notification);
      
      logger.info(`📢 Broadcast from ${client.userId}: ${message}`);
    });
    
    // 2. Targeted Notification (Send to specific user)
    socket.on('send-targeted', async (data) => {
      const { targetUserId, message, type = NOTIFICATION_TYPES.TARGETED } = data;
      
      if (!targetUserId || !message) {
        socket.emit('error', { message: 'Target user and message required' });
        return;
      }
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, target: targetUserId }
      );
      
      const success = await notificationService.sendToUser(targetUserId, notification);
      
      if (success) {
        logger.info(`🎯 Targeted notification from ${client.userId} to ${targetUserId}: ${message}`);
        socket.emit('notification-sent', { success: true, target: targetUserId });
      } else {
        socket.emit('error', { message: `User ${targetUserId} not found` });
      }
    });
    
    // 3. Group Notification (Send to room/group)
    socket.on('send-to-group', (data) => {
      const { roomId, message, type = NOTIFICATION_TYPES.GROUP } = data;
      
      if (!roomId || !message) {
        socket.emit('error', { message: 'Room ID and message required' });
        return;
      }
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, room: roomId }
      );
      
      const count = notificationService.sendToRoom(io, roomId, notification);
      
      logger.info(`👥 Group notification to ${roomId} from ${client.userId}: ${message} (${count} recipients)`);
      socket.emit('notification-sent', { success: true, room: roomId, recipients: count });
    });
    
    // 4. Scheduled Notification
    socket.on('schedule-notification', (data) => {
      const { delay, message, type = NOTIFICATION_TYPES.SCHEDULED, targetType, targetId } = data;
      
      if (!delay || !message) {
        socket.emit('error', { message: 'Delay and message required' });
        return;
      }
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, scheduled: true, delay }
      );
      
      notificationService.scheduleNotification(
        io,
        notification,
        delay,
        targetType,
        targetId
      );
      
      logger.info(`⏰ Scheduled notification from ${client.userId} in ${delay}ms: ${message}`);
      socket.emit('notification-scheduled', { 
        success: true, 
        delay, 
        message,
        deliveryTime: new Date(Date.now() + delay).toISOString()
      });
    });
    
    // 5. Manual Trigger (Event-based)
    socket.on('trigger-event', (data) => {
      const { eventName, message } = data;
      
      const notification = notificationService.createNotification(
        message || `Event triggered: ${eventName}`,
        NOTIFICATION_TYPES.EVENT_TRIGGERED,
        { source: client.userId, event: eventName }
      );
      
      notificationService.broadcastToAll(io, notification);
      
      logger.info(`⚡ Event triggered: ${eventName} by ${client.userId}`);
    });
    
    // ========== ROOM MANAGEMENT ==========
    
    // Join a room
    socket.on('join-room', (roomId) => {
      const result = roomManager.addToRoom(roomId, socket.id, client.userId);
      
      if (result.success) {
        socket.join(roomId);
        socket.emit('room-joined', { roomId, members: result.memberCount });
        
        // Notify room members
        io.to(roomId).emit('room-update', {
          roomId,
          members: roomManager.getRoomMembers(roomId),
          action: 'join',
          user: client.userId
        });
        
        logger.info(`Client ${client.userId} joined room: ${roomId}`);
      } else {
        socket.emit('error', { message: result.error });
      }
    });
    
    // Leave a room
    socket.on('leave-room', (roomId) => {
      const result = roomManager.removeFromRoom(roomId, socket.id);
      
      if (result.success) {
        socket.leave(roomId);
        socket.emit('room-left', { roomId });
        
        // Notify room members
        io.to(roomId).emit('room-update', {
          roomId,
          members: roomManager.getRoomMembers(roomId),
          action: 'leave',
          user: client.userId
        });
        
        logger.info(`Client ${client.userId} left room: ${roomId}`);
      }
    });
    
    // Create a room
    socket.on('create-room', (roomName) => {
      const roomId = roomManager.createRoom(roomName, client.userId);
      socket.emit('room-created', { roomId, roomName });
      logger.info(`Room created: ${roomName} (${roomId}) by ${client.userId}`);
    });
    
    // Get rooms list
    socket.on('get-rooms', () => {
      socket.emit('rooms-list', {
        rooms: roomManager.getAllRooms()
      });
    });
    
    // ========== CONNECTION MANAGEMENT ==========
    
    // Handle ping
    socket.on('ping', () => {
      connectionManager.updateLastPing(socket.id);
      socket.emit('pong', { timestamp: Date.now() });
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      const disconnectedClient = connectionManager.removeClient(socket.id);
      
      if (disconnectedClient) {
        // Remove from all rooms
        roomManager.removeClientFromAllRooms(socket.id);
        
        logger.info(`❌ Client disconnected: ${disconnectedClient.userId} (${socket.id})`);
        logger.info(`📊 Active clients: ${connectionManager.getActiveCount()}`);
        
        // Broadcast updated client count
        io.emit('clients-update', {
          count: connectionManager.getActiveCount(),
          clients: connectionManager.getAllClients(),
          disconnected: disconnectedClient.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Handle reconnection attempt
    socket.on('reconnect-attempt', (attemptNumber) => {
      logger.info(`Client ${client.userId} attempting reconnect (attempt ${attemptNumber})`);
    });
    
    // Handle reconnection success
    socket.on('reconnect-success', () => {
      logger.info(`Client ${client.userId} reconnected successfully`);
      socket.emit('reconnected', {
        userId: client.userId,
        timestamp: new Date().toISOString()
      });
    });
  });
  
  logger.info('🔌 Socket handlers initialized');
}

module.exports = setupSocketHandlers;