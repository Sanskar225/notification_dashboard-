const logger = require('./logger');

class ConnectionManager {
  constructor() {
    this.clients = new Map(); // socket.id -> client object
    this.userIdMap = new Map(); // userId -> socket.id
    this.stats = {
      totalConnections: 0,
      totalDisconnections: 0,
      peakConnections: 0,
      connectionHistory: []
    };
  }
  
  addClient(socket) {
    const userId = this.generateUserId();
    const client = {
      userId,
      socketId: socket.id,
      socket: socket,
      connectedAt: new Date(),
      lastPing: new Date(),
      lastActivity: new Date(),
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      rooms: new Set(['general']), // ✅ Add to default room
      reconnectAttempts: 0
    };
    
    this.clients.set(socket.id, client);
    this.userIdMap.set(userId, socket.id);
    
    this.stats.totalConnections++;
    if (this.clients.size > this.stats.peakConnections) {
      this.stats.peakConnections = this.clients.size;
    }
    
    this.recordHistoryPoint();
    
    // ✅ Enhanced connection log with structured format
    logger.info(`🔌 User connected: ${userId}`, {
      userId,
      socketId: socket.id,
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      activeClients: this.clients.size,
      timestamp: new Date().toISOString()
    });
    
    return client;
  }
  
  removeClient(socketId) {
    const client = this.clients.get(socketId);
    
    if (client) {
      // ✅ Enhanced disconnection log
      logger.info(`❌ User disconnected: ${client.userId}`, {
        userId: client.userId,
        socketId: client.socketId,
        connectedDuration: Math.floor((Date.now() - client.connectedAt.getTime()) / 1000),
        activeClients: this.clients.size - 1,
        timestamp: new Date().toISOString()
      });
      
      if (client.socket) {
        delete client.socket;
      }
      this.clients.delete(socketId);
      this.userIdMap.delete(client.userId);
      this.stats.totalDisconnections++;
      this.recordHistoryPoint();
      return client;
    }
    
    logger.warn(`⚠️ Attempted to remove non-existent client: ${socketId}`);
    return null;
  }
  
  getClient(socketId) {
    return this.clients.get(socketId);
  }
  
  getClientByUserId(userId) {
    const socketId = this.userIdMap.get(userId);
    return socketId ? this.clients.get(socketId) : null;
  }
  
  getAllClients() {
    return Array.from(this.clients.values()).map(client => ({
      userId: client.userId,
      socketId: client.socketId,
      connectedAt: client.connectedAt,
      lastPing: client.lastPing,
      ip: client.ip,
      rooms: Array.from(client.rooms)
    }));
  }
  
  getActiveCount() {
    return this.clients.size;
  }
  
  getTotalConnections() {
    return this.stats.totalConnections;
  }
  
  getStats() {
    return {
      ...this.stats,
      currentConnections: this.clients.size,
      timestamp: new Date().toISOString()
    };
  }
  
  updateLastPing(socketId) {
    const client = this.clients.get(socketId);
    if (client) {
      client.lastPing = new Date();
      client.lastActivity = new Date();
    }
  }
  
  generateUserId() {
    return `USER_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }
  
  recordHistoryPoint() {
    this.stats.connectionHistory.push({
      timestamp: new Date().toISOString(),
      connections: this.clients.size,
      totalConnections: this.stats.totalConnections
    });
    
    if (this.stats.connectionHistory.length > 100) {
      this.stats.connectionHistory.shift();
    }
  }
  
  cleanupIdleConnections(timeout = 300000) {
    const now = Date.now();
    const toRemove = [];
    
    for (const [socketId, client] of this.clients.entries()) {
      if (now - client.lastPing.getTime() > timeout) {
        toRemove.push(socketId);
      }
    }
    
    toRemove.forEach(socketId => {
      const client = this.clients.get(socketId);
      if (client && client.socket) {
        client.socket.disconnect(true);
      }
      this.removeClient(socketId);
    });
    
    if (toRemove.length > 0) {
      logger.info(`🧹 Cleaned up ${toRemove.length} idle connections`);
    }
    
    return toRemove.length;
  }
}

module.exports = new ConnectionManager();

