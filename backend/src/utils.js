/**
 * Utility functions
 */

const crypto = require('crypto');

function generateId(prefix = '') {
  const random = crypto.randomBytes(8).toString('hex');
  return prefix ? `${prefix}_${random}` : random;
}

function formatDate(date) {
  return new Date(date).toLocaleString();
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'just now';
}

function sanitizeMessage(message) {
  return message
    .replace(/[<>]/g, '')
    .substring(0, 500);
}

// ✅ ADD THIS
function truncateMessage(message, maxLength = 200) {
  if (!message) return '';
  return message.length > maxLength
    ? message.slice(0, maxLength)
    : message;
}

// ✅ ADD THIS
function isValidMessage(message) {
  return typeof message === 'string' && message.trim().length > 0;
}

module.exports = {
  generateId,
  formatDate,
  getTimeAgo,
  sanitizeMessage,
  truncateMessage,     // ✅ FIX
  isValidMessage       // ✅ FIX
};