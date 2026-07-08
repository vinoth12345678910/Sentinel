const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

class ApiClient {
  constructor() {
    this.token = null
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('sentinel_token')
        if (stored) this.token = stored
      } catch (e) {}
    }
  }

  setToken(token) { this.token = token; try { localStorage.setItem('sentinel_token', token) } catch (e) {} }
  clearToken() { this.token = null; try { localStorage.removeItem('sentinel_token') } catch (e) {} }

  getHeaders() {
    const h = { 'Content-Type': 'application/json' }
    if (this.token) h['Authorization'] = `Bearer ${this.token}`
    return h
  }

  async request(method, path, body) {
    const opts = { method, headers: this.getHeaders(), credentials: 'include' }
    if (body !== undefined) opts.body = JSON.stringify(body)
    let res = await fetch(`${API_BASE}${path}`, opts)
    if (res.status === 401) {
      const ok = await this.refreshToken()
      if (!ok) { this.clearToken(); return null }
      opts.headers['Authorization'] = `Bearer ${this.token}`
      if (body !== undefined) opts.body = JSON.stringify(body)
      res = await fetch(`${API_BASE}${path}`, opts)
    }
    if (!res.ok) {
      let data; try { data = await res.json() } catch (e) { data = null }
      const err = new Error(data?.message || `Request failed (${res.status})`)
      err.status = res.status; throw err
    }
    return res.status === 204 ? null : res.json()
  }

  get(path, params) {
    let url = path
    if (params) {
      const qs = Object.entries(params).filter(([,v]) => v != null).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')
      if (qs) url += `?${qs}`
    }
    return this.request('GET', url)
  }

  post(path, body) { return this.request('POST', path, body) }
  patch(path, body) { return this.request('PATCH', path, body) }
  delete(path) { return this.request('DELETE', path) }

  login(username, password) { return this.post('/auth/login', { username, password }) }
  register(username, email, password) { return this.post('/auth/register', { username, email, password }) }

  async refreshToken() {
    try {
      const data = await this.post('/auth/refresh')
      if (data?.accessToken) { this.setToken(data.accessToken); return true }
      return false
    } catch (e) { return false }
  }

  logout() { return this.post('/auth/logout') }
  getMe() { return this.get('/users/me') }
  listApps() { return this.get('/apps') }
  getApp(name) { return this.get(`/apps/${encodeURIComponent(name)}`) }
  updateAppConfig(name, data) { return this.post(`/apps/${encodeURIComponent(name)}/config`, data) }
  patchApp(name, data) { return this.patch(`/apps/${encodeURIComponent(name)}`, data) }
  rollbackToDeployment(name, depId) { return this.post(`/apps/${encodeURIComponent(name)}/deployments/${encodeURIComponent(depId)}/rollback`) }
  deleteApp(name) { return this.delete(`/apps/${encodeURIComponent(name)}`) }
  updateAppDomain(name, domain) { return this.patch(`/apps/${encodeURIComponent(name)}/domain`, { domain }) }
  listCustomDomains(name) { return this.get(`/apps/${encodeURIComponent(name)}/custom-domains`) }
  addCustomDomain(name, domain) { return this.post(`/apps/${encodeURIComponent(name)}/custom-domains/${encodeURIComponent(domain)}`) }
  removeCustomDomain(name, domain) { return this.delete(`/apps/${encodeURIComponent(name)}/custom-domains/${encodeURIComponent(domain)}`) }
  listPreviews(name) { return this.get(`/apps/${encodeURIComponent(name)}/previews`) }
  enablePreview(name, branch) { return this.put(`/apps/${encodeURIComponent(name)}/previews/${encodeURIComponent(branch)}`) }
  disablePreview(name, branch) { return this.delete(`/apps/${encodeURIComponent(name)}/previews/${encodeURIComponent(branch)}`) }
  listAppDeployments(name) { return this.get(`/apps/${encodeURIComponent(name)}/deployments`) }
  getDeployment(id) { return this.get(`/deployments/${encodeURIComponent(id)}`) }
  listDeployments(params) { return this.get('/deployments', params) }
  triggerDeploy(name, data) { return this.post(`/apps/${encodeURIComponent(name)}/deploy`, data) }
  listProjects() { return this.get('/projects') }
  getProject(id) { return this.get(`/projects/${encodeURIComponent(id)}`) }
  createProject(data) { return this.post('/projects', data) }
  getHealth() { return this.get('/health') }
  getSettings() { return this.get('/settings') }
  updateSettings(data) { return this.patch('/settings', data) }
  listTeams() { return this.get('/teams') }
  getTeam(id) { return this.get(`/teams/${encodeURIComponent(id)}`) }
  createTeam(data) { return this.post('/teams', data) }
  addTeamMember(teamId, data) { return this.post(`/teams/${encodeURIComponent(teamId)}/members`, data) }
  removeTeamMember(teamId, userId) { return this.delete(`/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`) }
  listTeamProjects(teamId) { return this.get(`/teams/${encodeURIComponent(teamId)}/projects`) }
  addTeamProject(teamId, data) { return this.post(`/teams/${encodeURIComponent(teamId)}/projects`, data) }
  removeTeamProject(teamId, projId) { return this.delete(`/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projId)}`) }
  getMonitoring() { return this.get('/monitoring') }
  getAlerts() { return this.get('/monitoring/alerts') }
  createAlert(data) { return this.post('/monitoring/alerts', data) }
  updateAlert(id, data) { return this.patch(`/monitoring/alerts/${encodeURIComponent(id)}`, data) }
  deleteAlert(id) { return this.delete(`/monitoring/alerts/${encodeURIComponent(id)}`) }
  getAuditLog(params) { return this.get('/audit-log', params) }
  listUsers(params) { return this.get('/users', params) }
  updateUser(id, data) { return this.patch(`/users/${encodeURIComponent(id)}`, data) }
  deleteUser(id) { return this.delete(`/users/${encodeURIComponent(id)}`) }
  getGithubRepos() { return this.get('/github/repos') }
  importGithubRepo(data) { return this.post('/apps/import', data) }
}

const api = new ApiClient()
export default api
export { ApiClient }
