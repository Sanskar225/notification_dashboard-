import { useEffect, useState, useCallback } from 'react'

export function useStats() {
  const [stats, setStats] = useState({
    totalSent: 0,
    todayCount: 0,
    activeRooms: 0,
    uptime: 0,
    peakConnections: 0,
  })
  const [uptimeDisplay, setUptimeDisplay] = useState('--:--:--')

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats/detailed')
      if (!res.ok) return
      const data = await res.json()
      setStats({
        totalSent: data.notifications?.totalSent ?? 0,
        todayCount: data.notifications?.todayCount ?? 0,
        activeRooms: data.rooms?.count ?? 0,
        uptime: data.system?.uptime ?? 0,
        peakConnections: data.connections?.peakConnections ?? 0,
      })
    } catch {}
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 15000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // live uptime counter
  useEffect(() => {
    if (!stats.uptime) return
    const startedAt = Date.now() - stats.uptime * 1000
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      const h = String(Math.floor(elapsed / 3600)).padStart(2, '0')
      const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
      const s = String(elapsed % 60).padStart(2, '0')
      setUptimeDisplay(`${h}:${m}:${s}`)
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [stats.uptime])

  return { stats, uptimeDisplay, fetchStats }
}
