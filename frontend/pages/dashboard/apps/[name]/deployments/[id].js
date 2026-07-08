import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../../../../../components/Layout'
import { Card, PageHeader, StatusBadge, LoadingState, Terminal } from '../../../../../components/ui'
import api from '../../../../../lib/api'
import { useGuard } from '../../../../../lib/AuthContext'
import { formatDate } from '../../../../../lib/utils'

export default function DeploymentDetailPage() {
  useGuard()
  const router = useRouter()
  const { name, id } = router.query
  const [deployment, setDeployment] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const eventSourceRef = useRef(null)

  const decodedName = name ? decodeURIComponent(name) : ''
  const decodedId = id || ''

  useEffect(() => {
    if (!decodedId) return
    api.getDeployment(decodedId)
      .then(data => {
        setDeployment(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [decodedId])

  useEffect(() => {
    if (!decodedId || !decodedName) return
    // Connect to SSE stream for live logs
    const token = api.token
    if (!token) return
    const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/deployments/${encodeURIComponent(decodedId)}/stream?token=${encodeURIComponent(token)}`
    
    const es = new EventSource(url)
    eventSourceRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.log) {
          setLogs(prev => [...prev, data.log])
        }
        if (data.status) {
          setDeployment(prev => prev ? { ...prev, status: data.status } : prev)
        }
      } catch (e) {
        setLogs(prev => [...prev, event.data])
      }
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [decodedId, decodedName])

  if (loading) return <Layout title="Deployment"><LoadingState /></Layout>
  if (!deployment && !loading) return <Layout title="Deployment"><PageHeader title="Deployment Not Found" /><p className="text-muted">This deployment does not exist.</p></Layout>

  return (
    <Layout title="Deployment">
      <PageHeader title={`Deployment ${(deployment?.commit_hash || decodedId).slice(0, 7)}`}>
        <Link href={`/dashboard/apps/${encodeURIComponent(decodedName)}`} className="btn btn-ghost btn-sm">Back to App</Link>
      </PageHeader>

      <Card title="Details">
        <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
          <div><span className="text-muted">Status:</span> <StatusBadge status={deployment?.status || 'pending'} /></div>
          <div><span className="text-muted">App:</span> {decodedName}</div>
          <div><span className="text-muted">Branch:</span> {deployment?.branch || '-'}</div>
          <div><span className="text-muted">Commit:</span> <code className="text-mono">{(deployment?.commit_hash || deployment?.commit || '').slice(0, 7)}</code></div>
          <div><span className="text-muted">Triggered:</span> {deployment?.created_at ? formatDate(deployment.created_at) : '-'}</div>
        </div>
      </Card>

      <Card title="Build Log">
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          <Terminal lines={logs} id="deployment-log" />
        </div>
      </Card>
    </Layout>
  )
}
