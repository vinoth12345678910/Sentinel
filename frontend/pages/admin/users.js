import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, StatusBadge, LoadingState, Table } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'
import { formatDate } from '../../lib/utils'

export default function AdminUsersPage() {
  useGuard()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listUsers()
      .then(data => { if (Array.isArray(data)) setUsers(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout title="Admin Users" admin><LoadingState /></Layout>

  const headers = ['ID', 'Username', 'Email', 'Role', 'Created']
  const rows = users.map(u => [
    u.id,
    u.username,
    u.email || '-',
    <span className={`badge badge-${u.role === 'admin' ? 'success' : 'info'}`}>{u.role || 'member'}</span>,
    u.created_at ? formatDate(u.created_at) : '-',
  ])

  return (
    <Layout title="Admin Users" admin>
      <PageHeader title="Users" description="Manage system users" />
      <Card>
        <Table headers={headers} rows={rows} emptyText="No users found" />
      </Card>
    </Layout>
  )
}
