import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { Card, PageHeader, LoadingState, Terminal } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

const CONFIG_STEPS = [
  { id: 'branch', label: 'Branch', default: 'main' },
  { id: 'build_cmd', label: 'Build Command', default: '', placeholder: 'e.g. npm install && npm run build' },
  { id: 'start_cmd', label: 'Start Command', default: '', placeholder: 'e.g. npm start' },
  { id: 'port', label: 'Container Port', default: '3000' },
  { id: 'health_path', label: 'Health Check Path', default: '/health' },
]

export default function ImportPage() {
  useGuard()
  const router = useRouter()
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [configRepo, setConfigRepo] = useState(null)
  const [importing, setImporting] = useState(null)
  const [error, setError] = useState('')
  const [notConnected, setNotConnected] = useState(false)
  const [search, setSearch] = useState('')
  const [config, setConfig] = useState({})
  const [deployId, setDeployId] = useState(null)
  const [deployLogs, setDeployLogs] = useState([])
  const [deployStatus, setDeployStatus] = useState('')

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

  const filtered = search
    ? repos.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()) || (r.language || '').toLowerCase().includes(search.toLowerCase()))
    : repos

  const openConfig = (repo) => {
    setConfigRepo(repo)
    setConfig({
      branch: 'main',
      build_cmd: '',
      start_cmd: '',
      port: '3000',
      health_path: '/health',
    })
    setError('')
  }

  const handleDeploy = async () => {
    if (!configRepo) return
    setError('')
    setImporting(configRepo.name)
    setDeployLogs([])
    setDeployStatus('importing')
    setDeployId(null)
    try {
      setDeployLogs(prev => [...prev, 'Importing app...'])
      const res = await api.importGithubRepo({
        repo_name: configRepo.name,
        repo_url: configRepo.url,
        branch: config.branch || 'main',
        build_command: config.build_cmd?.trim() || undefined,
        start_command: config.start_cmd?.trim() || undefined,
        container_port: parseInt(config.port) || 3000,
        health_path: config.health_path?.trim() || '/health',
      })
      setImporting(null)
      setDeployLogs(prev => [...prev, `App imported: ${configRepo.name}`])
      const depId = res?.app?.deployment_id
      if (depId) {
        setDeployId(depId)
        setDeployStatus('deploying')
        setDeployLogs(prev => [...prev, 'Connecting to build log stream...'])
      } else {
        setDeployStatus('done')
        setDeployLogs(prev => [...prev, `Deployment started. Redirecting...`])
        setTimeout(() => router.push(`/dashboard/apps/${encodeURIComponent(configRepo.name)}`), 1500)
      }
    } catch (err) {
      setError(err.message || 'Failed to deploy')
      setImporting(null)
      setDeployStatus('')
    }
  }

  // Poll deployment status when deployId is set
  useEffect(() => {
    if (!deployId) return
    const interval = setInterval(async () => {
      try {
        const dep = await api.getDeployment(deployId)
        if (dep) {
          setDeployStatus(dep.status || 'deploying')
          if (dep.status === 'SUCCESS' || dep.status === 'FAILED' || dep.status === 'CANCELLED') {
            clearInterval(interval)
            setDeployLogs(prev => [...prev, `Deployment ${dep.status}: ${dep.failure_reason || ''}`.trim()])
          }
        }
      } catch (e) { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [deployId])

  const cancelConfig = () => {
    setConfigRepo(null)
    setError('')
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
          <p className="text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
            Don't have a connected account? Use the{' '}
            <Link href="/dashboard/create">Manual Setup</Link> wizard instead.
          </p>
        </Card>
      ) : configRepo && !importing && !deployId ? (
        /* Config step */
        <Card title={`Configure: ${configRepo.full_name}`}>
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {CONFIG_STEPS.map(s => (
              <div key={s.id} className="form-group">
                <label className="form-label">{s.label}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={s.placeholder || s.default}
                  value={config[s.id] || ''}
                  onChange={e => setConfig(prev => ({ ...prev, [s.id]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button className="btn btn-ghost" onClick={cancelConfig}>Cancel</button>
              <button className="btn btn-primary" onClick={handleDeploy} disabled={importing !== null}>
                {importing ? 'Deploying...' : 'Deploy'}
              </button>
            </div>
          </div>
        </Card>
      ) : deployStatus === 'importing' || deployId || deployStatus === 'done' ? (
        /* Deployment progress */
        <Card title={`Deploying: ${configRepo?.full_name || ''}`}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <span className="text-muted">Status: </span>
            <span className={`badge badge-${deployStatus === 'SUCCESS' ? 'success' : deployStatus === 'FAILED' ? 'error' : 'info'}`}>
              {deployStatus.toUpperCase()}
            </span>
          </div>
          {deployLogs.length > 0 && (
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <Terminal lines={deployLogs} id="deploy-log" />
            </div>
          )}
          {(deployStatus === 'SUCCESS' || deployStatus === 'done') && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Link href={`/dashboard/apps/${encodeURIComponent(configRepo?.name || '')}`} className="btn btn-primary">
                View App
              </Link>
            </div>
          )}
          {deployStatus === 'FAILED' && (
            <div style={{ marginTop: 'var(--space-3)' }}>
              <Link href={`/dashboard/apps/${encodeURIComponent(configRepo?.name || '')}`} className="btn btn-ghost">
                View App Details
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="search-bar" style={{ marginBottom: 'var(--space-3)' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Card title={`Repositories (${filtered.length})`}>
            {filtered.length === 0 ? (
              <p className="text-muted">
                {search ? 'No repositories match your search.' : 'No repositories found.'}
              </p>
            ) : (
              <div className="app-card-grid">
                {filtered.map(r => (
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
                          onClick={() => openConfig(r)}
                        >
                          Deploy
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </Layout>
  )
}
