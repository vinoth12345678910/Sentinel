import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { Card, PageHeader, StatusBadge, LoadingState } from '../../components/ui'
import api from '../../lib/api'
import { useGuard } from '../../lib/AuthContext'
import { formatDate, timeAgo } from '../../lib/utils'

export default function TeamsPage() {
  useGuard()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  const fetchTeams = () => {
    api.listTeams()
      .then(data => { if (Array.isArray(data)) setTeams(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTeams() }, [])

  const createTeam = async () => {
    if (!newName.trim()) return
    try {
      await api.createTeam({ name: newName })
      setNewName('')
      setShowCreate(false)
      fetchTeams()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <Layout title="Teams"><LoadingState /></Layout>

  return (
    <Layout title="Teams">
      <PageHeader
        title="Teams"
        description="Manage your teams and collaborators"
        actions={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Team</button>}
      />
      {showCreate && (
        <Card title="New Team">
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input type="text" className="form-input" placeholder="Team name" value={newName} onChange={e => setNewName(e.target.value)} />
            <button className="btn btn-primary" onClick={createTeam}>Create</button>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </Card>
      )}
      <Card>
        {teams.length === 0 ? (
          <p className="text-muted">No teams yet.</p>
        ) : (
          teams.map(t => (
            <div key={t.id} className="app-card" style={{ cursor: 'default', marginBottom: 'var(--space-2)' }}>
              <div className="app-card-left">
                <div className="app-card-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div className="app-card-info">
                  <div className="app-card-name">{t.name}</div>
                  {t.description && <div className="app-card-desc">{t.description}</div>}
                </div>
              </div>
              <div className="app-card-right">
                <span className="text-xs text-muted">{t.member_count || t.members?.length || 0} members</span>
              </div>
            </div>
          ))
        )}
      </Card>
    </Layout>
  )
}
