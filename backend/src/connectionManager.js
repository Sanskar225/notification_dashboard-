/**
 * Connection Manager
 * Advanced client tracking with detailed statistics
 */

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
      connectedAt: new Date(),
      lastPing: new Date(),
      lastActivity: new Date(),
      ip: socket.handshake.address,
      userAgent: socket.handshake.headers['user-agent'],
      rooms: new Set(),
      reconnectAttempts: 0
    };
    
    this.clients.set(socket.id, client);
    this.userIdMap.set(userId, socket.id);
    
    this.stats.totalConnections++;
    if (this.clients.size > this.stats.peakConnections) {
      this.stats.peakConnections = this.clients.size;
    }
    
    this.recordHistoryPoint();
    
    return client;
  }
  
  removeClient(socketId) {
    const client = this.clients.get(socketId);
    
    if (client) {
      this.clients.delete(socketId);
      this.userIdMap.delete(client.userId);
      this.stats.totalDisconnections++;
      this.recordHistoryPoint();
      return client;
    }
    
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
      connectedAt: client.connectedAt,
      lastPing: client.lastPing,
      ip: client.ip
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
    
    // Keep last 100 records
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
    
    return toRemove.length;
  }
}

module.exports = new ConnectionManager();