
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const logger = require('./logger');
const setupSocketHandlers = require('./socket');
const connectionManager = require('./connectionManager');
const notificationService = require('./notificationService');
const roomManager = require('./roomManager');
const routes = require('./routes');

function createServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Socket.IO with advanced config
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: parseInt(process.env.PING_TIMEOUT) || 60000,
    pingInterval: parseInt(process.env.PING_INTERVAL) || 25000,
    connectTimeout: 45000
  });
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files
  const clientPath = path.join(__dirname, '../../client');
  app.use(express.static(clientPath));
  
  // Make io accessible in routes
  app.set('io', io);
  
  // API Routes
  app.use('/api', routes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeClients: connectionManager.getActiveCount(),
      totalNotifications: notificationService.getTotalSent(),
      rooms: roomManager.getAllRooms()
    });
  });
  
  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', (req, res) => {
    res.json({
      activeClients: connectionManager.getActiveCount(),
      totalConnections: connectionManager.getTotalConnections(),
      totalNotifications: notificationService.getTotalSent(),
      notificationsToday: notificationService.getTodayCount(),
      activeRooms: roomManager.getActiveRoomCount(),
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  });
  
  // Root route
  app.get('/', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
  
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ 
      error: 'Route not found',
      path: req.path 
    });
  });
  
  // Error handler
  app.use((err, req, res, next) => {
    logger.error('Server error:', err.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });
  
  // Setup Socket.IO handlers
  setupSocketHandlers(io);
  
  // Start notification services
  if (process.env.ENABLE_AUTO_NOTIFICATIONS !== 'false') {
    notificationService.startAutoScheduler(io);
  }
  
  return { app, server, io };
}

module.exports = { createServer };