import { useState, useEffect } from 'react'
import Panel from './Panel'
import { TYPE_ICONS, TYPE_COLORS } from '../utils'

const FILTERS = ['all','info','success','warning','error','broadcast','targeted','group','scheduled','event_triggered']

function NotifItem({ notif }) {
  const color = TYPE_COLORS[notif.type] || TYPE_COLORS.info
  const icon = TYPE_ICONS[notif.type] || '🔔'
  const time = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      className={`type-${notif.type}`}
      style={{
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--nb, rgba(255,255,255,0.02))',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        animation: 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 8,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {/* left accent stripe */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: '0 0 0 10px' }} />
      
      {/* icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `rgba(${hexToRgb(color)}, 0.12)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.84rem', lineHeight: 1.4, marginBottom: 4 }}>{notif.message}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '1px 7px', borderRadius: 4,
            fontSize: '0.6rem', fontFamily: 'var(--font-mono)',
            fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em',
            background: `rgba(${hexToRgb(color)}, 0.15)`,
            color,
          }}>{notif.type}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{time}</span>
          {notif.metadata?.sequence && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>#{notif.metadata.sequence}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0,2), 16)
  const g = parseInt(clean.substring(2,4), 16)
  const b = parseInt(clean.substring(4,6), 16)
  return `${r},${g},${b}`
}

export default function NotificationFeed({ notifications, onClear }) {
  const [filter, setFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter)

  // Pagination logic
  const totalItems = filtered.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filtered.slice(startIndex, endIndex)

  const visibleFilters = ['all','info','success','warning','error','broadcast']

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  return (
    <Panel
      title="Live Feed"
      icon="🔔"
      headerRight={
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Items per page selector */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            style={{
              padding: '5px 8px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-dim)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
          
          <button
            onClick={onClear}
            style={{
              padding: '5px 12px', borderRadius: 7,
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-dim)' }}
          >
            Clear
          </button>
        </div>
      }
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* filter tabs — above the scrollable area */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        padding: '0 0 12px 0', marginBottom: 4,
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {visibleFilters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
              border: '1px solid var(--border)',
              background: filter === f ? 'rgba(200,181,96,0.1)' : 'transparent',
              borderColor: filter === f ? 'rgba(200,181,96,0.3)' : 'var(--border)',
              color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)', fontSize: '0.67rem', letterSpacing: '0.05em',
              transition: 'all 0.15s',
            }}
          >
            {f}
            {f !== 'all' && (
              <span style={{
                marginLeft: 6,
                padding: '1px 4px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.1)',
                fontSize: '0.6rem',
              }}>
                {notifications.filter(n => n.type === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* scrollable feed */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 300 }}>
        {currentItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12, opacity: 0.35 }}>📭</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.7 }}>
              {filter === 'all' ? 'Waiting for notifications…' : `No "${filter}" notifications yet.`}<br />
              Server auto-sends every 10 seconds.
            </div>
          </div>
        ) : (
          <>
            {currentItems.map((n, i) => <NotifItem key={n.id || i} notif={n} />)}
            
            {/* Pagination info */}
            <div style={{
              marginTop: 16,
              padding: '12px 0',
              textAlign: 'center',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              borderTop: '1px solid var(--border)',
            }}>
              Showing {startIndex + 1} - {Math.min(endIndex, totalItems)} of {totalItems} notifications
            </div>
          </>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && currentItems.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '12px 0 0 0',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
          marginTop: 8,
        }}>
          <button
            onClick={() => goToPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
              color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dim)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              transition: 'all 0.15s',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            «
          </button>
          
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: currentPage === 1 ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
              color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-dim)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              transition: 'all 0.15s',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            ‹
          </button>

          {getPageNumbers().map(page => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: currentPage === page ? 'rgba(200,181,96,0.15)' : 'var(--surface)',
                borderColor: currentPage === page ? 'rgba(200,181,96,0.4)' : 'var(--border)',
                color: currentPage === page ? 'var(--accent)' : 'var(--text-dim)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: currentPage === page ? 600 : 400,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = 'var(--surface-hover)'
                }
              }}
              onMouseLeave={e => {
                if (currentPage !== page) {
                  e.currentTarget.style.background = 'var(--surface)'
                }
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
              color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-dim)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              transition: 'all 0.15s',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            ›
          </button>
          
          <button
            onClick={() => goToPage(totalPages)}
            disabled={currentPage === totalPages}
            style={{
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.03)' : 'var(--surface)',
              color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-dim)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              fontSize: '0.7rem',
              transition: 'all 0.15s',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            »
          </button>
        </div>
      )}
    </Panel>
  )
}