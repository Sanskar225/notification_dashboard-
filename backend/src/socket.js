
const connectionManager = require('./connectionManager');
const notificationService = require('./notificationService');
const roomManager = require('./roomManager');
const logger = require('./logger');
const { sanitizeMessage, truncateMessage, isValidMessage } = require('./utils');

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

const MAX_MESSAGE_LENGTH = 200;

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Add client to tracking
    const client = connectionManager.addClient(socket);
    
    // ✅ Auto-join default "general" room
    socket.join('general');
    roomManager.addToRoom('general', socket.id, client.userId, io);
    
    logger.info(`✅ Client connected: ${client.userId} (${socket.id})`, {
      userId: client.userId,
      socketId: socket.id,
      activeClients: connectionManager.getActiveCount(),
      rooms: ['general']
    });
    
    // Send initial data to client
    socket.emit('welcome', {
      userId: client.userId,
      activeClients: connectionManager.getActiveCount(),
      serverTime: new Date().toISOString(),
      notificationTypes: NOTIFICATION_TYPES,
      defaultRoom: 'general'
    });
    
    // Send current room list with member counts
    socket.emit('rooms-list', {
      rooms: roomManager.getAllRooms()
    });
    
    // Broadcast updated client count
    io.emit('clients-update', {
      count: connectionManager.getActiveCount(),
      clients: connectionManager.getAllClients(),
      timestamp: new Date().toISOString()
    });
    
    // Broadcast room users update for general room
    io.to('general').emit('room-users-update', {
      roomId: 'general',
      roomName: 'General',
      count: roomManager.getRoomUserCount('general'),
      users: roomManager.getRoomMembers('general').map(m => m.userId),
      action: 'join',
      user: client.userId,
      timestamp: new Date().toISOString()
    });
    
    // ========== NOTIFICATION HANDLERS ==========
    
    socket.on('send-broadcast', (data) => {
      let { message, type = NOTIFICATION_TYPES.BROADCAST } = data;
      
      if (!message) {
        socket.emit('error', { message: 'Message is required' });
        return;
      }
      
      if (!isValidMessage(message)) {
        socket.emit('error', { message: 'Message must be between 1 and 200 characters' });
        return;
      }
      
      message = sanitizeMessage(message);
      message = truncateMessage(message, MAX_MESSAGE_LENGTH);
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, broadcast: true }
      );
      
      notificationService.broadcastToAll(io, notification);
      
      socket.emit('notification-sent', { success: true, type: 'broadcast' });
    });
    
    socket.on('send-targeted', async (data) => {
      let { targetUserId, message, type = NOTIFICATION_TYPES.TARGETED } = data;
      
      if (!targetUserId || !message) {
        socket.emit('error', { message: 'Target user and message required' });
        return;
      }
      
      if (!isValidMessage(message)) {
        socket.emit('error', { message: 'Message must be between 1 and 200 characters' });
        return;
      }
      
      message = sanitizeMessage(message);
      message = truncateMessage(message, MAX_MESSAGE_LENGTH);
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, target: targetUserId }
      );
      
      const success = await notificationService.sendToUser(targetUserId, notification, io);
      
      if (success) {
        socket.emit('notification-sent', { success: true, type: 'targeted', target: targetUserId });
      } else {
        socket.emit('error', { message: `User ${targetUserId} not found` });
      }
    });
    
    socket.on('send-to-group', (data) => {
      let { roomId, message, type = NOTIFICATION_TYPES.GROUP } = data;
      
      if (!roomId || !message) {
        socket.emit('error', { message: 'Room ID and message required' });
        return;
      }
      
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: `Room ${roomId} does not exist` });
        return;
      }
      
      if (!isValidMessage(message)) {
        socket.emit('error', { message: 'Message must be between 1 and 200 characters' });
        return;
      }
      
      message = sanitizeMessage(message);
      message = truncateMessage(message, MAX_MESSAGE_LENGTH);
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, room: roomId }
      );
      
      const count = notificationService.sendToRoom(io, roomId, notification);
      
      socket.emit('notification-sent', { 
        success: true, 
        type: 'group', 
        room: roomId, 
        recipients: count 
      });
    });
    
    socket.on('schedule-notification', (data) => {
      let { delay, message, type = NOTIFICATION_TYPES.SCHEDULED, targetType, targetId } = data;
      
      if (!delay || !message) {
        socket.emit('error', { message: 'Delay and message required' });
        return;
      }
      
      if (typeof delay !== 'number' || delay <= 0 || delay > 86400000) {
        socket.emit('error', { message: 'Delay must be between 1ms and 24 hours' });
        return;
      }
      
      if (!isValidMessage(message)) {
        socket.emit('error', { message: 'Message must be between 1 and 200 characters' });
        return;
      }
      
      message = sanitizeMessage(message);
      message = truncateMessage(message, MAX_MESSAGE_LENGTH);
      
      if (targetType === 'room' && targetId) {
        const room = roomManager.getRoom(targetId);
        if (!room) {
          socket.emit('error', { message: `Target room ${targetId} does not exist` });
          return;
        }
      }
      
      const notification = notificationService.createNotification(
        message,
        type,
        { source: client.userId, scheduled: true, delay }
      );
      
      const jobId = notificationService.scheduleNotification(
        io,
        notification,
        delay,
        targetType,
        targetId
      );
      
      socket.emit('notification-scheduled', { 
        success: true, 
        jobId,
        delay, 
        message,
        deliveryTime: new Date(Date.now() + delay).toISOString()
      });
    });
    
    socket.on('trigger-event', (data) => {
      let { eventName, message } = data;
      
      if (!eventName) {
        socket.emit('error', { message: 'Event name required' });
        return;
      }
      
      eventName = sanitizeMessage(eventName).substring(0, 50);
      if (message) {
        if (!isValidMessage(message)) {
          socket.emit('error', { message: 'Message too long (max 200 chars)' });
          return;
        }
        message = sanitizeMessage(message);
        message = truncateMessage(message, MAX_MESSAGE_LENGTH);
      }
      
      const notification = notificationService.createNotification(
        message || `Event triggered: ${eventName}`,
        NOTIFICATION_TYPES.EVENT_TRIGGERED,
        { source: client.userId, event: eventName }
      );
      
      notificationService.broadcastToAll(io, notification);
      
      socket.emit('event-triggered', { success: true, event: eventName });
    });
    
    // ========== ROOM MANAGEMENT ==========
    
    socket.on('join-room', (roomId) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: `Room ${roomId} does not exist` });
        return;
      }
      
      const result = roomManager.addToRoom(roomId, socket.id, client.userId, io);
      
      if (result.success) {
        socket.join(roomId);
        socket.emit('room-joined', { roomId, roomName: room.name, members: result.memberCount });
        
        logger.info(`👥 User ${client.userId} joined room: ${room.name} (${roomId})`);
      } else {
        socket.emit('error', { message: result.error });
      }
    });
    
    socket.on('leave-room', (roomId) => {
      const room = roomManager.getRoom(roomId);
      if (!room) {
        socket.emit('error', { message: `Room ${roomId} does not exist` });
        return;
      }
      
      // Prevent leaving default room
      if (roomId === 'general') {
        socket.emit('error', { message: 'Cannot leave the default "general" room' });
        return;
      }
      
      const result = roomManager.removeFromRoom(roomId, socket.id, io);
      
      if (result.success) {
        socket.leave(roomId);
        socket.emit('room-left', { roomId });
        
        logger.info(`👥 User ${client.userId} left room: ${room.name} (${roomId})`);
      }
    });
    
    socket.on('create-room', (roomName) => {
      roomName = sanitizeMessage(roomName).substring(0, 50);
      
      if (!roomName) {
        socket.emit('error', { message: 'Room name is required' });
        return;
      }
      
      try {
        const roomId = roomManager.createRoom(roomName, client.userId);
        socket.emit('room-created', { roomId, roomName });
        logger.info(`🏠 Room created: ${roomName} (${roomId}) by ${client.userId}`);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });
    
    socket.on('get-rooms', () => {
      socket.emit('rooms-list', {
        rooms: roomManager.getAllRooms()
      });
    });
    
    // ========== CONNECTION MANAGEMENT ==========
    
    socket.on('ping', () => {
      connectionManager.updateLastPing(socket.id);
      socket.emit('pong', { timestamp: Date.now() });
    });
    
    socket.on('disconnect', (reason) => {
      const disconnectedClient = connectionManager.removeClient(socket.id);
      
      if (disconnectedClient) {
        roomManager.removeClientFromAllRooms(socket.id, io);
        
        // Broadcast updated client count
        io.emit('clients-update', {
          count: connectionManager.getActiveCount(),
          clients: connectionManager.getAllClients(),
          disconnected: disconnectedClient.userId,
          timestamp: new Date().toISOString()
        });
        
        // Update general room user count
        io.to('general').emit('room-users-update', {
          roomId: 'general',
          roomName: 'General',
          count: roomManager.getRoomUserCount('general'),
          users: roomManager.getRoomMembers('general').map(m => m.userId),
          action: 'disconnect',
          user: disconnectedClient.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  logger.info('🔌 Socket handlers initialized with default room support');
}

module.exports = setupSocketHandlers;