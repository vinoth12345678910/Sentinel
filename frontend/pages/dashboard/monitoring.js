import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { PageHeader, MetricsGrid, Card, StatusBadge, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'
import { formatDate } from '../../lib/utils'

export default function MonitoringPage() {
  useGuard()
  const [health, setHealth] = useState({})
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    Promise.all([
      api.getHealth().catch(() => ({})),
      api.getAlerts().catch(() => []),
    ]).then(([h, a]) => {
      setHealth(h)
      if (Array.isArray(a)) setAlerts(a)
      setLoading(false)
    })
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <Layout title="Monitoring"><LoadingState /></Layout>

  const statusColor = health.status === 'healthy' || health.status === 'ok' ? 'success' : 'danger'

  return (
    <Layout title="Monitoring">
      <PageHeader title="Monitoring" description="System health and alerts" />
      <MetricsGrid metrics={[
        { label: 'Status', value: <StatusBadge status={health.status || 'unknown'} /> },
        { label: 'Uptime', value: health.uptime ? `${Math.floor(Number(health.uptime) / 3600)}h` : '-' },
        { label: 'Environment', value: health.environment || '-' },
        { label: 'Version', value: health.version || '-' },
      ]} />
      <Card title="Alerts">
        {alerts.length === 0 ? (
          <p className="text-muted">No alerts configured.</p>
        ) : (
          alerts.map(a => (
            <div key={a.id} className="metric-card" style={{ marginBottom: 'var(--space-2)' }}>
              <div className="metric-label">{a.name}</div>
              <div className="metric-value" style={{ fontSize: 'var(--text-sm)' }}>
                <StatusBadge status={a.status || a.enabled ? 'active' : 'disabled'} />
                {a.condition && <span className="text-muted" style={{ marginLeft: 8 }}>{a.condition}</span>}
              </div>
            </div>
          ))
        )}
      </Card>
    </Layout>
  )
}
