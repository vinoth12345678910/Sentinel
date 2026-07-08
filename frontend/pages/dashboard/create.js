import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { Card, PageHeader } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function CreatePage() {
  useGuard()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [repo, setRepo] = useState('')
  const [branch, setBranch] = useState('main')
  const [buildCmd, setBuildCmd] = useState('')
  const [startCmd, setStartCmd] = useState('')
  const [port, setPort] = useState('3000')
  const [healthPath, setHealthPath] = useState('/health')
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }])
  const updateEnvVar = (i, field, val) => {
    const updated = [...envVars]
    updated[i][field] = val
    setEnvVars(updated)
  }
  const removeEnvVar = (i) => setEnvVars(envVars.filter((_, idx) => idx !== i))

  const handleCreate = async () => {
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    if (!repo.trim()) { setError('GitHub Repository URL is required.'); return }
    setCreating(true)
    try {
      const envObj = {}
      envVars.filter(e => e.key.trim()).forEach(e => { envObj[e.key.trim()] = e.value })
      const repoUrl = repo.trim().replace(/\/$/, '')
      const repoName = name.trim()
      await api.importGithubRepo({
        repo_name: repoName,
        repo_url: repoUrl,
        branch: branch.trim(),
        build_command: buildCmd.trim() || undefined,
        start_command: startCmd.trim() || undefined,
        container_port: parseInt(port) || 3000,
        health_path: healthPath.trim() || '/health',
        env: Object.keys(envObj).length > 0 ? envObj : undefined,
      })
      router.push(`/dashboard/apps/${encodeURIComponent(repoName)}`)
    } catch (err) {
      setError(err.message || 'Failed to create app.')
    } finally { setCreating(false) }
  }

  return (
    <Layout title="Create App">
      <PageHeader title="Create New App" description="Deploy your application in minutes" />
      <Card>
        <div className="wizard-steps" style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          {['Configure', 'Environment', 'Deploy'].map((s, i) => (
            <div key={i} className={`wizard-step${step === i + 1 ? ' active' : ''}${i + 1 < step ? ' completed' : ''}`}>
              <div className="wizard-step-number">{i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="login-error" style={{ display: 'block', marginBottom: 'var(--space-3)' }}>{error}</div>}

        {step === 1 && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="form-group">
              <label className="form-label">App Name *</label>
              <input type="text" className="form-input" placeholder="my-app" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">GitHub Repository URL</label>
              <input type="text" className="form-input" placeholder="https://github.com/user/repo" value={repo} onChange={e => setRepo(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Branch</label>
              <input type="text" className="form-input" placeholder="main" value={branch} onChange={e => setBranch(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Build Command</label>
              <input type="text" className="form-input" placeholder="npm install && npm run build" value={buildCmd} onChange={e => setBuildCmd(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Start Command</label>
              <input type="text" className="form-input" placeholder="npm start" value={startCmd} onChange={e => setStartCmd(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Container Port</label>
                <input type="text" className="form-input" placeholder="3000" value={port} onChange={e => setPort(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Health Check Path</label>
                <input type="text" className="form-input" placeholder="/health" value={healthPath} onChange={e => setHealthPath(e.target.value)} />
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Environment</button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <p className="text-sm text-muted">Configure environment variables for your app.</p>
            {envVars.map((ev, i) => (
              <div key={i} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input type="text" className="form-input" placeholder="KEY" value={ev.key} onChange={e => updateEnvVar(i, 'key', e.target.value)} style={{ flex: 1 }} />
                <input type="text" className="form-input" placeholder="VALUE" value={ev.value} onChange={e => updateEnvVar(i, 'value', e.target.value)} style={{ flex: 2 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => removeEnvVar(i)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            <button className="btn btn-outline btn-sm" onClick={addEnvVar}>+ Add Variable</button>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Review</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <h3>Review Configuration</h3>
            <div className="metric-card">
              <div className="metric-label">Name</div><div>{name || '-'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Repository</div><div>{repo || 'Not specified'}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Branch</div><div>{branch}</div>
            </div>
            <div className="metric-card">
              <div className="metric-label">Port</div><div>{port}</div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Deploy App'}
              </button>
            </div>
          </div>
        )}
      </Card>
    </Layout>
  )
}
