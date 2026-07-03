import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function AdminSecurityPage() {
  useGuard()
  const [health, setHealth] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getHealth()
      .then(h => setHealth(h || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const apiKey = health.api_key || health.SENTINEL_API_KEY || health.master_key || ''
  const masked = apiKey.length > 8
    ? apiKey.slice(0, 4) + '•'.repeat(8) + apiKey.slice(-4)
    : apiKey

  const copyKey = () => {
    if (apiKey) { navigator.clipboard?.writeText(apiKey); alert('API key copied') }
  }

  if (loading) return <Layout title="Admin Security" admin><LoadingState /></Layout>

  return (
    <Layout title="Admin Security" admin>
      <PageHeader title="Security" description="Security settings and API keys" />
      <Card title="API Key">
        <p className="text-sm text-muted">Master API key for system-level access.</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <code style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)', userSelect: 'all' }}>{masked}</code>
          {apiKey && <button className="btn btn-outline btn-sm" onClick={copyKey}>Copy</button>}
        </div>
      </Card>
      <Card title="Authentication Methods">
        <p className="text-muted">Authentication is configured via JWT tokens and GitHub OAuth.</p>
        <div className="metric-card" style={{ marginTop: 'var(--space-2)' }}>
          <div className="metric-label">JWT</div>
          <div className="metric-value"><span className="badge badge-success">Enabled</span></div>
        </div>
      </Card>
    </Layout>
  )
}
