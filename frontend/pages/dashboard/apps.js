import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { Card, PageHeader, StatusBadge } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function AppsPage() {
  useGuard()
  const [apps, setApps] = useState([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listApps()
      .then(data => { if (Array.isArray(data)) setApps(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter
    ? apps.filter(a => (a.name || a.app_name || a.repo_name || '').toLowerCase().includes(filter.toLowerCase()))
    : apps

  return (
    <Layout title="Apps">
      <PageHeader
        title="Apps"
        actions={<Link href="/dashboard/create" className="btn btn-primary">New App</Link>}
      />
      <div className="search-bar" style={{ marginBottom: 'var(--space-3)' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search apps..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      <Card>
        {loading ? <div className="loading-state"><div className="spinner" /></div> : (
          <div className="app-card-grid">
            {filtered.length === 0 ? (
              <p className="text-muted">No apps found.</p>
            ) : (
              filtered.map(a => {
                const name = a.name || a.app_name || a.repo_name || 'Unnamed'
                const domain = a.domain || a.domains?.[0] || ''
                return (
                  <Link key={name} href={`/dashboard/apps/${encodeURIComponent(name)}`} className="app-card">
                    <div className="app-card-left">
                      <div className="app-card-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                      </div>
                      <div className="app-card-info">
                        <div className="app-card-name">{name}</div>
                        {a.description && <div className="app-card-desc">{a.description}</div>}
                      </div>
                    </div>
                    <div className="app-card-right">
                      {domain && <span className="text-xs text-muted">{domain}</span>}
                      <StatusBadge status={a.status || 'unknown'} />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        )}
      </Card>
    </Layout>
  )
}
