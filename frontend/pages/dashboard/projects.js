import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { Card, PageHeader } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'

export default function ProjectsPage() {
  useGuard()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listProjects()
      .then(data => { if (Array.isArray(data)) setProjects(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Layout title="Projects">
      <PageHeader
        title="Projects"
        description="Manage your projects"
        actions={<Link href="/dashboard/create" className="btn btn-primary">New Project</Link>}
      />
      <Card>
        {loading ? <div className="loading-state"><div className="spinner" /></div> : (
          <div className="app-card-grid">
            {projects.length === 0 ? (
              <p className="text-muted">No projects yet. Create one to get started.</p>
            ) : (
              projects.map(p => (
                <Link key={p.id || p.name} href={`/dashboard/projects/${p.id || p.name}`} className="app-card">
                  <div className="app-card-left">
                    <div className="app-card-avatar">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div className="app-card-info">
                      <div className="app-card-name">{p.name}</div>
                      {p.description && <div className="app-card-desc">{p.description}</div>}
                    </div>
                  </div>
                  <div className="app-card-right">
                    <span className="text-xs text-muted">{p.app_count ?? p.apps?.length ?? 0} apps</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </Card>
    </Layout>
  )
}
