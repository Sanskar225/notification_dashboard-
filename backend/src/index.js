
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { createServer } = require('./server');
const logger = require('./logger');

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

// Start server
const startServer = async () => {
  try {
    const { server, io, app } = createServer();
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    server.listen(PORT, HOST, () => {
      logger.info('╔══════════════════════════════════════════════════════════╗');
      logger.info('║     🚀 REAL-TIME NOTIFICATION SYSTEM v2.0               ║');
      logger.info('╠══════════════════════════════════════════════════════════╣');
      logger.info(`║  Server:     http://${HOST}:${PORT}`);
      logger.info(`║  WebSocket:  ws://${HOST}:${PORT}`);
      logger.info(`║  Environment: ${process.env.NODE_ENV}`);
      logger.info(`║  PID:        ${process.pid}`);
      logger.info(`║  Auto Notifications: Every ${process.env.AUTO_NOTIFICATION_INTERVAL / 1000}s`);
      logger.info(`║  Features:   Broadcast | Targeted | Groups | Scheduled`);
      logger.info('╚══════════════════════════════════════════════════════════╝');
    });
    
    // Graceful shutdown
    const gracefulShutdown = () => {
      logger.info('\n📡 Shutting down gracefully...');
      server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
      
      setTimeout(() => {
        logger.error('⚠️ Forced shutdown');
        process.exit(1);
      }, 5000);
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();