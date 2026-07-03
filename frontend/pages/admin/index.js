import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, MetricsGrid, StatusBadge, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function AdminDashboardPage() {
  useGuard()
  const [health, setHealth] = useState({})
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getHealth().catch(() => ({})),
      api.listUsers().catch(() => []),
    ]).then(([h, u]) => {
      setHealth(h)
      if (Array.isArray(u)) setUsers(u)
      setLoading(false)
    })
  }, [])

  if (loading) return <Layout title="Admin" admin><LoadingState /></Layout>

  return (
    <Layout title="Admin Console" admin>
      <PageHeader title="Admin Console" description="System administration and management" />
      <MetricsGrid metrics={[
        { label: 'Status', value: <StatusBadge status={health.status || 'unknown'} /> },
        { label: 'Users', value: String(users.length) },
        { label: 'Environment', value: health.environment || '-' },
        { label: 'Version', value: health.version || '-' },
      ]} />
      <Card title="System Health">
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <div><span className="text-muted">Uptime:</span> {health.uptime ? `${Math.floor(Number(health.uptime) / 3600)}h` : '-'}</div>
          <div><span className="text-muted">Timestamp:</span> {health.timestamp || '-'}</div>
        </div>
      </Card>
    </Layout>
  )
}
