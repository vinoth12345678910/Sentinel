import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, StatusBadge, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'
import { formatDate } from '../../lib/utils'

export default function AdminAuditPage() {
  useGuard()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getAuditLog()
      .then(data => { if (Array.isArray(data)) setLogs(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Admin Audit" admin><LoadingState /></Layout>

  return (
    <Layout title="Admin Audit Log" admin>
      <PageHeader title="Audit Log" description="System-wide audit trail" />
      <Card>
        {logs.length === 0 ? (
          <p className="text-muted">No audit log entries.</p>
        ) : (
          <div className="timeline">
            {logs.map((log, i) => (
              <div key={log.id || i} className="timeline-item">
                <div className="timeline-marker">
                  <StatusBadge status={log.action || log.event || 'info'} />
                </div>
                <div className="timeline-content">
                  <div><strong>{log.user || log.username || 'System'}</strong> {log.action || log.event}</div>
                  {log.details && <div className="text-xs text-muted">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</div>}
                  <div className="text-xs text-muted">{log.created_at ? formatDate(log.created_at) : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Layout>
  )
}
