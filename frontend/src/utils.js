export const TYPE_ICONS = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
  broadcast: '📡',
  targeted: '🎯',
  group: '👥',
  scheduled: '⏰',
  event_triggered: '⚡',
}

export const TYPE_COLORS = {
  info: '#60a5fa',
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  broadcast: '#a78bfa',
  targeted: '#f472b6',
  group: '#fb923c',
  scheduled: '#9ca3af',
  event_triggered: '#2dd4bf',
}

export const FILTER_TYPES = ['all', 'info', 'success', 'warning', 'error', 'broadcast', 'targeted', 'group', 'scheduled', 'event_triggered']

export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function timeAgo(dateStr) {
  const secs = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  return `${Math.floor(secs / 3600)}h ago`
}
