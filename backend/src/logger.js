/**
 * Simple Logger with colors and file output
 */

const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(
  path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`),
  { flags: 'a' }
);

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function formatMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  let msg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (data) {
    msg += ` ${JSON.stringify(data)}`;
  }
  return msg;
}

function getColor(level) {
  const colorsMap = {
    error: colors.red,
    warn: colors.yellow,
    info: colors.green,
    debug: colors.cyan,
    http: colors.blue
  };
  return colorsMap[level] || colors.reset;
}

function log(level, message, data) {
  const formatted = formatMessage(level, message, data);
  const color = getColor(level);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${color}${formatted}${colors.reset}`);
  } else {
    console.log(formatted);
  }
  
  logStream.write(formatted + '\n');
}

const logger = {
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  info: (msg, data) => log('info', msg, data),
  debug: (msg, data) => log('debug', msg, data),
  http: (msg, data) => log('http', msg, data)
};

module.exports = logger;