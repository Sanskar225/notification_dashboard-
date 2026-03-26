
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const connectionManager = require('./connectionManager');
const roomManager = require('./roomManager');
const { sanitizeMessage, truncateMessage, isValidMessage } = require('./utils');

const MAX_MESSAGE_LENGTH = 200;

class NotificationService {
  constructor() {
    this.totalSent = 0;
    this.todayCount = 0;
    this.lastNotification = null;
    this.scheduledJobs = new Map();
    this.notificationHistory = []; // ✅ Store notification history with metadata
    this.messagePool = [
      { message: "📢 New system update available", type: "info", weight: 10 },
      { message: "✅ Database backup completed", type: "success", weight: 8 },
      { message: "⚠️ High memory usage detected", type: "warning", weight: 3 },
      { message: "🔔 New user joined the platform", type: "info", weight: 5 },
      { message: "🎉 Performance optimization deployed", type: "success", weight: 7 },
      { message: "📊 Real-time sync active", type: "info", weight: 6 },
      { message: "⚡ WebSocket connection stable", type: "success", weight: 9 },
      { message: "💾 Cache cleared successfully", type: "success", weight: 4 },
      { message: "🔄 Background job completed", type: "info", weight: 6 },
      { message: "🔒 Security scan passed", type: "success", weight: 5 }
    ];
    this.resetTimer = null;
    this.initDailyReset();
  }
  
  initDailyReset() {
    const now = new Date();
    const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const msUntilMidnight = night.getTime() - now.getTime();
    
    setTimeout(() => {
      this.todayCount = 0;
      this.initDailyReset();
    }, msUntilMidnight);
  }
  
  createNotification(message, type = 'info', metadata = {}) {
    let sanitizedMessage = sanitizeMessage(message);
    sanitizedMessage = truncateMessage(sanitizedMessage, MAX_MESSAGE_LENGTH);
    
    if (!sanitizedMessage) {
      sanitizedMessage = 'Notification';
    }
    
    return {
      id: uuidv4(),
      message: sanitizedMessage,
      type,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        notificationId: this.totalSent + 1,
        deliveryMethod: metadata.broadcast ? 'broadcast' : (metadata.target ? 'targeted' : 'standard')
      },
      source: 'server'
    };
  }
  
  generateRandomNotification() {
    const totalWeight = this.messagePool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selected = this.messagePool[0];
    for (const item of this.messagePool) {
      if (random < item.weight) {
        selected = item;
        break;
      }
      random -= item.weight;
    }
    
    return this.createNotification(
      selected.message,
      selected.type,
      { auto: true, sequence: this.totalSent + 1 }
    );
  }
  
  broadcastToAll(io, notification) {
    const activeCount = connectionManager.getActiveCount();
    
    if (activeCount === 0) {
      logger.debug('No active clients to notify');
      return 0;
    }
    
    io.emit('notification', notification);
    this.updateStats(notification);
    
    // ✅ Enhanced notification log with metadata
    logger.info(`📢 Notification sent: "${notification.message}"`, {
      notificationId: notification.id,
      type: notification.type,
      recipients: activeCount,
      metadata: notification.metadata,
      timestamp: new Date().toISOString()
    });
    
    return activeCount;
  }
  
  async sendToUser(userId, notification, io) {
    if (!userId || typeof userId !== 'string') {
      logger.warn(`⚠️ Invalid userId format: ${userId}`);
      return false;
    }
    
    const client = connectionManager.getClientByUserId(userId);
    
    if (client && client.socketId) {
      io.to(client.socketId).emit('notification', notification);
      this.updateStats(notification);
      
      // ✅ Enhanced targeted notification log
      logger.info(`🎯 Targeted notification sent: "${notification.message}"`, {
        notificationId: notification.id,
        type: notification.type,
        targetUser: userId,
        timestamp: new Date().toISOString()
      });
      
      return true;
    }
    
    logger.warn(`⚠️ User not found: ${userId} for targeted notification`);
    return false;
  }
  
  sendToRoom(io, roomId, notification) {
    const room = roomManager.getRoom(roomId);
    if (!room) {
      logger.warn(`⚠️ Invalid room: ${roomId} for group notification`);
      return 0;
    }
    
    const roomMembers = roomManager.getRoomMembers(roomId);
    const activeMembers = roomMembers.filter(member => {
      const client = connectionManager.getClientByUserId(member.userId);
      return client !== null;
    });
    
    if (activeMembers.length === 0) return 0;
    
    io.to(roomId).emit('notification', notification);
    this.updateStats(notification);
    
    // ✅ Enhanced group notification log
    logger.info(`👥 Group notification sent: "${notification.message}"`, {
      notificationId: notification.id,
      type: notification.type,
      roomId,
      roomName: room.name,
      recipients: activeMembers.length,
      timestamp: new Date().toISOString()
    });
    
    return activeMembers.length;
  }
  
  scheduleNotification(io, notification, delay, targetType = 'broadcast', targetId = null) {
    const jobId = uuidv4();
    const scheduledTime = new Date(Date.now() + delay);
    
    logger.info(`⏰ Scheduled notification: "${notification.message}"`, {
      jobId,
      delay: `${delay}ms`,
      scheduledTime: scheduledTime.toISOString(),
      targetType,
      targetId: targetId || 'all',
      timestamp: new Date().toISOString()
    });
    
    const timeout = setTimeout(() => {
      // ✅ Clear scheduler logging when triggered
      logger.info(`⏱ AUTO TRIGGER: ${new Date().toISOString()}`, {
        jobId,
        notificationId: notification.id,
        message: notification.message,
        scheduledDelay: `${delay}ms`,
        actualDelay: `${Date.now() - (scheduledTime.getTime() - delay)}ms`
      });
      
      switch (targetType) {
        case 'broadcast':
          this.broadcastToAll(io, notification);
          break;
        case 'user':
          if (targetId) this.sendToUser(targetId, notification, io);
          break;
        case 'room':
          if (targetId) {
            const room = roomManager.getRoom(targetId);
            if (room) {
              this.sendToRoom(io, targetId, notification);
            } else {
              logger.warn(`⚠️ Scheduled notification cancelled: Room ${targetId} not found`);
            }
          }
          break;
      }
      this.scheduledJobs.delete(jobId);
    }, delay);
    
    this.scheduledJobs.set(jobId, { timeout, notification, deliveryTime: Date.now() + delay });
    
    return jobId;
  }
  
  cancelScheduledNotification(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      clearTimeout(job.timeout);
      this.scheduledJobs.delete(jobId);
      logger.info(`❌ Cancelled scheduled notification: ${jobId}`);
      return true;
    }
    return false;
  }
  
  updateStats(notification) {
    this.totalSent++;
    this.todayCount++;
    this.lastNotification = notification;
    
    // ✅ Store in history (keep last 100)
    this.notificationHistory.unshift({
      ...notification,
      sequence: this.totalSent
    });
    
    if (this.notificationHistory.length > 100) {
      this.notificationHistory.pop();
    }
  }
  
  getTotalSent() {
    return this.totalSent;
  }
  
  getTodayCount() {
    return this.todayCount;
  }
  
  getLastNotification() {
    return this.lastNotification;
  }
  
  getNotificationHistory(limit = 50) {
    return this.notificationHistory.slice(0, limit);
  }
  
  startAutoScheduler(io) {
    const interval = parseInt(process.env.AUTO_NOTIFICATION_INTERVAL) || 10000;
    
    setInterval(() => {
      const activeCount = connectionManager.getActiveCount();
      
      // ✅ Clear scheduler logging every 10 seconds
      const timestamp = new Date().toISOString();
      logger.info(`⏱ AUTO TRIGGER: ${timestamp}`, {
        activeClients: activeCount,
        interval: `${interval}ms`,
        totalSent: this.totalSent,
        todayCount: this.todayCount
      });
      
      if (activeCount > 0) {
        const notification = this.generateRandomNotification();
        this.broadcastToAll(io, notification);
      } else {
        logger.debug(`⏱ Auto-trigger skipped: No active clients | ${timestamp}`);
      }
    }, interval);
    
    logger.info(`🤖 Auto-notification scheduler started (interval: ${interval}ms)`);
  }
  
  getStats() {
    return {
      totalSent: this.totalSent,
      todayCount: this.todayCount,
      scheduledJobs: this.scheduledJobs.size,
      lastNotification: this.lastNotification,
      activeClients: connectionManager.getActiveCount(),
      notificationHistory: this.getNotificationHistory(20)
    };
  }
  
  addCustomMessage(message, type = 'info', weight = 5) {
    const sanitizedMessage = sanitizeMessage(message);
    const truncatedMessage = truncateMessage(sanitizedMessage, MAX_MESSAGE_LENGTH);
    this.messagePool.push({ message: truncatedMessage, type, weight });
    logger.info(`📝 Added custom message: "${truncatedMessage}"`);
  }
}

module.exports = new NotificationService();