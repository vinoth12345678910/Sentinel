import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { Card, PageHeader, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function ImportPage() {
  useGuard()
  const router = useRouter()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(null)
  const [error, setError] = useState('')
  const [notConnected, setNotConnected] = useState(false)

  useEffect(() => {
    api.getGithubRepos()
      .then(data => {
        if (Array.isArray(data)) setRepos(data)
        setLoading(false)
      })
      .catch(err => {
        if (err.status === 401) {
          setNotConnected(true)
        } else {
          setError(err.message || 'Failed to list repos')
        }
        setLoading(false)
      })
  }, [])

  const handleImport = async (repo) => {
    setImporting(repo.name)
    setError('')
    try {
      const res = await api.importGithubRepo({
        repo_name: repo.name,
        repo_url: repo.url,
      })
      router.push(`/dashboard/apps/${encodeURIComponent(repo.name)}`)
    } catch (err) {
      setError(err.message || 'Failed to import app')
      setImporting(null)
    }
  }

  if (loading) return <Layout title="Import App"><LoadingState /></Layout>

  return (
    <Layout title="Import App">
      <PageHeader
        title="Import from GitHub"
        description="Select a repository to deploy"
        actions={<Link href="/dashboard/create" className="btn btn-ghost">Manual Setup</Link>}
      />

      {error && (
        <Card>
          <div className="login-error" style={{ display: 'block' }}>{error}</div>
        </Card>
      )}

      {notConnected ? (
        <Card title="Connect GitHub">
          <p className="text-muted" style={{ marginBottom: 'var(--space-3)' }}>
            Connect your GitHub account to import repositories.
          </p>
          <a href={`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/github`} className="btn btn-primary">
            Connect GitHub
          </a>
        </Card>
      ) : (
        <Card title="Repositories">
          {repos.length === 0 ? (
            <p className="text-muted">No repositories found.</p>
          ) : (
            <div className="app-card-grid">
              {repos.map(r => (
                <div key={r.full_name} className="app-card" style={{ cursor: 'default' }}>
                  <div className="app-card-left">
                    <div className="app-card-avatar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                      </svg>
                    </div>
                    <div className="app-card-info">
                      <div className="app-card-name">{r.full_name}</div>
                      {r.description && <div className="app-card-desc">{r.description}</div>}
                      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                        {r.language && <span className="badge badge-info">{r.language}</span>}
                        {r.private && <span className="badge badge-warning">Private</span>}
                      </div>
                    </div>
                  </div>
                  <div className="app-card-right">
                    {r.registered ? (
                      <Link href={`/dashboard/apps/${encodeURIComponent(r.name)}`} className="btn btn-ghost btn-sm">View</Link>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleImport(r)}
                        disabled={importing === r.name}
                      >
                        {importing === r.name ? 'Importing...' : 'Deploy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </Layout>
  )
}
