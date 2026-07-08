import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { Card, PageHeader, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function SettingsPage() {
  useGuard()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)

  const { github, github_error } = router.query

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

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub from Sentinel? This will not affect your GitHub account.')) return
    setDisconnecting(true)
    try {
      await api.disconnectGithub()
      setUser(prev => prev ? { ...prev, github_id: null, github_username: null } : prev)
    } catch (err) {
      alert(err.message || 'Failed to disconnect')
    }
    setDisconnecting(false)
  }

  if (loading) return <Layout title="Settings"><LoadingState /></Layout>

  return (
    <Layout title="Settings">
      <PageHeader title="Settings" description="Manage your account and preferences" />

      {github === 'connected' && (
        <Card title="">
          <div className="login-success" style={{ display: 'block' }}>GitHub connected successfully!</div>
        </Card>
      )}
      {github_error && (
        <Card title="">
          <div className="login-error" style={{ display: 'block' }}>
            {github_error === 'not_authenticated' && 'You must be logged in to connect GitHub.'}
            {github_error === 'session_expired' && 'Your session expired. Please log in again and retry.'}
            {github_error === 'callback_failed' && 'Failed to connect GitHub. Please try again.'}
            {github_error === 'missing_code' && 'GitHub did not return an authorization code.'}
            {!['not_authenticated', 'session_expired', 'callback_failed', 'missing_code'].includes(github_error) && `GitHub error: ${github_error}`}
          </div>
        </Card>
      )}

      <Card title="Account">
        {user && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div><label className="form-label">Username</label><div>{user.username}</div></div>
            <div><label className="form-label">Email</label><div>{user.email}</div></div>
            <div><label className="form-label">Role</label><div><span className={`badge badge-${user.role === 'admin' ? 'success' : 'info'}`}>{user.role}</span></div></div>
          </div>
        )}
      </Card>

      <Card title="GitHub">
        {user?.github_username ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span><strong>{user.github_username}</strong> <span className="badge badge-success">Connected</span></span>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleDisconnect} disabled={disconnecting}>
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>
              Connect your GitHub account to import repositories and trigger automatic deployments.
            </p>
            <a href={`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/github`} className="btn btn-primary">
              Connect GitHub
            </a>
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
