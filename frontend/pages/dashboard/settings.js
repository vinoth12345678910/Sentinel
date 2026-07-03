import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function SettingsPage() {
  useGuard()
  const [user, setUser] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getMe().catch(() => null),
      api.getHealth().catch(() => ({}))
    ]).then(([me, health]) => {
      if (me) setUser(me)
      setApiKey(health?.api_key || health?.SENTINEL_API_KEY || health?.master_key || '')
      setLoading(false)
    })
  }, [])

  const copyApiKey = () => {
    if (apiKey) {
      navigator.clipboard?.writeText(apiKey)
      alert('API key copied to clipboard')
    }
  }

  if (loading) return <Layout title="Settings"><LoadingState /></Layout>

  return (
    <Layout title="Settings">
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <Card title="Account">
        {user && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div><label className="form-label">Username</label><div>{user.username}</div></div>
            <div><label className="form-label">Email</label><div>{user.email}</div></div>
            <div><label className="form-label">Role</label><div><span className={`badge badge-${user.role === 'admin' ? 'success' : 'info'}`}>{user.role}</span></div></div>
          </div>
        )}
      </Card>
      <Card title="API Key">
        <p className="text-sm text-muted">Your personal API key for authenticating with the Sentinel API.</p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          <code style={{ flex: 1, padding: 'var(--space-2) var(--space-3)', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 'var(--text-sm)', userSelect: 'all' }}>
            {apiKey ? `${apiKey.slice(0, 4)}${'•'.repeat(Math.min(apiKey.length - 8, 20))}${apiKey.slice(-4)}` : 'No API key'}
          </code>
          {apiKey && <button className="btn btn-outline" onClick={copyApiKey}>Copy</button>}
        </div>
      </Card>
    </Layout>
  )
}
