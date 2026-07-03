import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../../components/Layout'
import { Card, PageHeader, StatusBadge, LoadingState } from '../../../components/ui'
import api from '../../../lib/api'
import { useGuard } from '../../../lib/AuthContext'
import { formatDate } from '../../../lib/utils'

export default function ProjectDetailPage() {
  useGuard()
  const router = useRouter()
  const { id } = router.query
  const [project, setProject] = useState(null)
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.getProject(id).catch(() => null),
      api.listApps().catch(() => []),
    ]).then(([proj, appList]) => {
      setProject(proj)
      if (proj && Array.isArray(appList)) {
        if (proj.apps && Array.isArray(proj.apps)) {
          setApps(proj.apps)
        }
      }
      setLoading(false)
    })
  }, [id])

  if (loading || !id) return <Layout title="Project"><LoadingState /></Layout>
  if (!project) return <Layout title="Project"><PageHeader title="Project Not Found" /><p className="text-muted">This project does not exist.</p></Layout>

  const projectName = project.name || id

  return (
    <Layout title={projectName}>
      <PageHeader title={projectName} description={project.description || 'Project details'}>
        <Link href="/dashboard/projects" className="btn btn-ghost btn-sm">Back to Projects</Link>
      </PageHeader>
      <Card title="Details">
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <div><span className="text-muted">Name:</span> {project.name}</div>
          {project.description && <div><span className="text-muted">Description:</span> {project.description}</div>}
          {project.created_at && <div><span className="text-muted">Created:</span> {formatDate(project.created_at)}</div>}
        </div>
      </Card>
      <Card title="Apps">
        {apps.length === 0 ? (
          <p className="text-muted">No apps in this project.</p>
        ) : (
          apps.map(a => (
            <Link key={a.name || a.repo_name} href={`/dashboard/apps/${encodeURIComponent(a.name || a.repo_name)}`} className="app-card" style={{ marginBottom: 'var(--space-2)' }}>
              <div className="app-card-left">
                <div className="app-card-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
                </div>
                <div className="app-card-info">
                  <div className="app-card-name">{a.name || a.repo_name || 'Unnamed'}</div>
                  {a.description && <div className="app-card-desc">{a.description}</div>}
                </div>
              </div>
              <div className="app-card-right">
                <StatusBadge status={a.status || 'unknown'} />
              </div>
            </Link>
          ))
        )}
      </Card>
    </Layout>
  )
}
