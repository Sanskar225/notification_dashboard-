/**
 * Notification Service
 * Handles all notification types: Broadcast, Targeted, Group, Scheduled
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const connectionManager = require('./connectionManager');
const roomManager = require('./roomManager');

class NotificationService {
  constructor() {
    this.totalSent = 0;
    this.todayCount = 0;
    this.lastNotification = null;
    this.scheduledJobs = new Map();
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
    return {
      id: uuidv4(),
      message,
      type,
      timestamp: new Date().toISOString(),
      metadata,
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
    
    logger.info(`📢 Broadcast to ${activeCount} clients: ${notification.message}`);
    return activeCount;
  }
  
  async sendToUser(userId, notification) {
    const client = connectionManager.getClientByUserId(userId);
    
    if (client && client.socket) {
      client.socket.emit('notification', notification);
      this.updateStats(notification);
      logger.info(`🎯 Sent to ${userId}: ${notification.message}`);
      return true;
    }
    
    return false;
  }
  
  sendToRoom(io, roomId, notification) {
    const roomMembers = roomManager.getRoomMembers(roomId);
    const activeMembers = roomMembers.filter(member => {
      const client = connectionManager.getClientByUserId(member.userId);
      return client !== null;
    });
    
    if (activeMembers.length === 0) return 0;
    
    io.to(roomId).emit('notification', notification);
    this.updateStats(notification);
    
    logger.info(`👥 Sent to room ${roomId}: ${notification.message} (${activeMembers.length} members)`);
    return activeMembers.length;
  }
  
  scheduleNotification(io, notification, delay, targetType = 'broadcast', targetId = null) {
    const jobId = uuidv4();
    
    const timeout = setTimeout(() => {
      switch (targetType) {
        case 'broadcast':
          this.broadcastToAll(io, notification);
          break;
        case 'user':
          if (targetId) this.sendToUser(targetId, notification);
          break;
        case 'room':
          if (targetId) this.sendToRoom(io, targetId, notification);
          break;
      }
      this.scheduledJobs.delete(jobId);
    }, delay);
    
    this.scheduledJobs.set(jobId, { timeout, notification, deliveryTime: Date.now() + delay });
    
    logger.info(`⏰ Scheduled notification (${jobId}) in ${delay}ms`);
    return jobId;
  }
  
  cancelScheduledNotification(jobId) {
    const job = this.scheduledJobs.get(jobId);
    if (job) {
      clearTimeout(job.timeout);
      this.scheduledJobs.delete(jobId);
      logger.info(`Cancelled scheduled notification: ${jobId}`);
      return true;
    }
    return false;
  }
  
  updateStats(notification) {
    this.totalSent++;
    this.todayCount++;
    this.lastNotification = notification;
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
  
  startAutoScheduler(io) {
    const interval = parseInt(process.env.AUTO_NOTIFICATION_INTERVAL) || 10000;
    
    setInterval(() => {
      const activeCount = connectionManager.getActiveCount();
      
      if (activeCount > 0) {
        const notification = this.generateRandomNotification();
        this.broadcastToAll(io, notification);
      }
    }, interval);
    
    logger.info(`Auto-notification scheduler started (interval: ${interval}ms)`);
  }
  
  getStats() {
    return {
      totalSent: this.totalSent,
      todayCount: this.todayCount,
      scheduledJobs: this.scheduledJobs.size,
      lastNotification: this.lastNotification,
      activeClients: connectionManager.getActiveCount()
    };
  }
  
  addCustomMessage(message, type = 'info', weight = 5) {
    this.messagePool.push({ message, type, weight });
    logger.info(`Added custom message: ${message}`);
  }
}

module.exports = new NotificationService();