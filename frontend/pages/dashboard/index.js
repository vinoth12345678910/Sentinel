import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { Card, PageHeader, MetricsGrid, Table, StatusBadge, Skeleton } from '../../components/ui'
import api from '../../lib/api'
import { formatDate, timeAgo } from '../../lib/utils'
import { useGuard } from '../../lib/AuthContext'

export default function DashboardPage() {
  const { user, loading: authLoading } = useGuard()
  const router = useRouter()
  const [metrics, setMetrics] = useState({ apps: '-', deployments: '-', projects: '-', uptime: '-' })
  const [recentDeployments, setRecentDeployments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading || !user) return
    Promise.all([
      api.listApps().catch(() => []),
      api.listDeployments().catch(() => []),
      api.listProjects().catch(() => []),
      api.getHealth().catch(() => ({}))
    ]).then(([apps, deployments, projects, health]) => {
      const uptimeVal = health?.uptime ? `${Math.floor(Number(health.uptime) / 3600)}h` : (health?.status === 'healthy' ? 'Healthy' : '-')
      setMetrics({
        apps: String(Array.isArray(apps) ? apps.length : 0),
        deployments: String(Array.isArray(deployments) ? deployments.length : 0),
        projects: String(Array.isArray(projects) ? projects.length : 0),
        uptime: uptimeVal,
      })
      setRecentDeployments(Array.isArray(deployments) ? deployments.slice(0, 5) : [])
      setLoading(false)
    })
  }, [user, authLoading])

  const headers = ['App', 'Branch', 'Commit', 'Status', 'Time']
  const rows = recentDeployments.map(d => [
    d.app_name || '',
    d.branch || '',
    (d.commit_hash || d.commit || '').slice(0, 7),
    <StatusBadge status={d.status || 'pending'} />,
    d.created_at ? (formatDate(d.created_at) || timeAgo(d.created_at)) : '',
  ])

  return (
    <Layout title="Dashboard">
      <PageHeader title="Dashboard" description="Overview of your deployment platform" />
      <MetricsGrid metrics={[
        { label: 'Apps', value: metrics.apps },
        { label: 'Deployments', value: metrics.deployments },
        { label: 'Projects', value: metrics.projects },
        { label: 'Uptime', value: metrics.uptime },
      ]} />
      <Card title="Recent Deployments">
        {loading ? (
          <div><Skeleton /><Skeleton /><Skeleton /></div>
        ) : (
          <Table headers={headers} rows={rows} emptyText="No recent deployments" />
        )}
      </Card>
      <Card title="Quick Actions">
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard/create')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ verticalAlign: 'middle', marginRight: 4 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New App
          </button>
          <button className="btn btn-default" onClick={() => router.push('/dashboard/apps')}>View Apps</button>
        </div>
      </Card>
    </Layout>
  )
}
