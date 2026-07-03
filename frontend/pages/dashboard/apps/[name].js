import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { Card, PageHeader, StatusBadge, Tabs, LoadingState, MetricsGrid } from '../../../components/ui'
import api from '../../../lib/api'
import { useGuard } from '../../../lib/AuthContext'
import { formatDate, timeAgo } from '../../../lib/utils'

export default function AppDetailPage() {
  useGuard()
  const router = useRouter()
  const { name } = router.query
  const [app, setApp] = useState(null)
  const [deployments, setDeployments] = useState([])
  const [envVars, setEnvVars] = useState({})
  const [domains, setDomains] = useState([])
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  const decodedName = name ? decodeURIComponent(name) : ''

  useEffect(() => {
    if (!decodedName) return
    setLoading(true)
    Promise.all([
      api.getApp(decodedName).catch(() => null),
      api.listAppDeployments(decodedName).catch(() => []),
      api.listCustomDomains(decodedName).catch(() => []),
    ]).then(([a, deps, doms]) => {
      setApp(a)
      if (Array.isArray(deps)) setDeployments(deps)
      if (Array.isArray(doms)) setDomains(doms)
      setLoading(false)
    })
  }, [decodedName])

  // Fetch env vars when tab changes to env
  useEffect(() => {
    if (tab === 'env' && decodedName && Object.keys(envVars).length === 0) {
      api.getSettings()
        .then(d => { if (d?.env_vars) setEnvVars(d.env_vars) })
        .catch(() => {})
    }
  }, [tab, decodedName])

  const triggerDeploy = async () => {
    try {
      await api.triggerDeploy(decodedName, { branch: 'main' })
      alert('Deployment triggered!')
    } catch (err) { alert(err.message) }
  }

  const rollback = async (depId) => {
    if (!confirm('Rollback to this deployment?')) return
    try {
      await api.rollbackToDeployment(decodedName, depId)
      alert('Rollback initiated!')
    } catch (err) { alert(err.message) }
  }

  if (loading || !name) return <Layout title="App"><LoadingState /></Layout>
  if (!app) return <Layout title="App"><PageHeader title="App Not Found" /><p className="text-muted">This app does not exist.</p></Layout>

  const appName = app.name || app.app_name || app.repo_name || decodedName
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'deployments', label: 'Deployments' },
    { id: 'env', label: 'Environment' },
    { id: 'domains', label: 'Domains' },
    { id: 'settings', label: 'Settings' },
  ]

  return (
    <Layout title={appName}>
      <PageHeader title={appName} description={app.description || app.repo_url || ''}>
        <Link href="/dashboard/apps" className="btn btn-ghost btn-sm">Back to Apps</Link>
      </PageHeader>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'overview' && (
        <>
          <MetricsGrid metrics={[
            { label: 'Status', value: <StatusBadge status={app.status || 'unknown'} /> },
            { label: 'Deployments', value: String(deployments.length) },
            { label: 'Port', value: String(app.host_port || app.container_port || '-') },
            { label: 'Domains', value: String(domains.length || (app.domain ? 1 : 0)) },
          ]} />
          <Card title="Details">
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <div><span className="text-muted">Repository:</span> {app.repo_url || '-'}</div>
              <div><span className="text-muted">Health Path:</span> {app.health_path || '-'}</div>
              <div><span className="text-muted">Domain:</span> {app.domain || '-'}</div>
              <div><span className="text-muted">Created:</span> {app.registered_at ? formatDate(app.registered_at) : '-'}</div>
            </div>
          </Card>
          <Card title="Quick Actions">
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={triggerDeploy}>Trigger Deploy</button>
              <button className="btn btn-outline" onClick={() => setTab('domains')}>Manage Domains</button>
              <button className="btn btn-outline" onClick={() => setTab('env')}>Environment Variables</button>
            </div>
          </Card>
        </>
      )}

      {tab === 'deployments' && (
        <Card title="Deployments">
          {deployments.length === 0 ? (
            <p className="text-muted">No deployments yet.</p>
          ) : (
            deployments.map(d => (
              <Link
                key={d.id}
                href={`/dashboard/apps/${encodeURIComponent(decodedName)}/deployments/${d.id}`}
                className="app-card"
                style={{ marginBottom: 'var(--space-2)' }}
              >
                <div className="app-card-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <StatusBadge status={d.status || 'pending'} />
                    <span className="text-mono">{d.branch || 'main'}</span>
                    <span className="text-mono text-xs">{(d.commit_hash || d.commit || '').slice(0, 7)}</span>
                  </div>
                  <div className="text-xs text-muted">{d.created_at ? formatDate(d.created_at) : ''}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.preventDefault(); rollback(d.id) }}>
                  Rollback
                </button>
              </Link>
            ))
          )}
        </Card>
      )}

      {tab === 'env' && (
        <Card title="Environment Variables">
          {Object.keys(envVars).length === 0 ? (
            <p className="text-muted">No environment variables configured.</p>
          ) : (
            Object.entries(envVars).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', gap: 'var(--space-2)', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border)' }}>
                <code style={{ flex: 1 }}>{k}</code>
                <code className="text-muted">{'•'.repeat(String(v).length)}</code>
              </div>
            ))
          )}
        </Card>
      )}

      {tab === 'domains' && (
        <Card title="Custom Domains">
          {domains.length === 0 && !app.domain ? (
            <p className="text-muted">No custom domains configured.</p>
          ) : (
            <>
              {app.domain && (
                <div className="app-card" style={{ cursor: 'default', marginBottom: 'var(--space-2)' }}>
                  <div className="app-card-info"><strong>{app.domain}</strong><span className="badge badge-success" style={{ marginLeft: 8 }}>Active</span></div>
                </div>
              )}
              {domains.map(d => (
                <div key={d.domain || d} className="app-card" style={{ cursor: 'default', marginBottom: 'var(--space-2)' }}>
                  <div className="app-card-info"><strong>{d.domain || d}</strong><span className={`badge badge-${d.verified ? 'success' : 'warning'}`}>{d.verified ? 'Verified' : 'Pending'}</span></div>
                </div>
              ))}
            </>
          )}
        </Card>
      )}

      {tab === 'settings' && (
        <Card title="App Settings">
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">Health Check Path</label>
              <input type="text" className="form-input" defaultValue={app.health_path || '/health'} />
            </div>
            <div className="form-group">
              <label className="form-label">Container Port</label>
              <input type="text" className="form-input" defaultValue={app.container_port || '3000'} />
            </div>
            <button className="btn btn-danger" style={{ justifySelf: 'start' }}>Delete App</button>
          </div>
        </Card>
      )}
    </Layout>
  )
}
