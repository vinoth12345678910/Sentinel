const API = (() => {
  let accessToken = sessionStorage.getItem('sentinel_access_token') || null;

  function setToken(token) {
    accessToken = token;
    if (token) sessionStorage.setItem('sentinel_access_token', token);
    else sessionStorage.removeItem('sentinel_access_token');
  }

  function getToken() { return accessToken; }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }

  async function request(method, path, body) {
    const opts = { method, headers: getAuthHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    if (res.status === 401 && accessToken) {
      const refreshed = await tryRefresh();
      if (refreshed) return request(method, path, body);
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async function tryRefresh() {
    try {
      const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) return false;
      const data = await res.json();
      setToken(data.accessToken);
      return true;
    } catch { return false; }
  }

  return {
    setToken,
    getToken,
    getAuthHeaders,
    login: (username, password) =>
      fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, password }),
      }).then(async (res) => {
        if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
        return res.json();
      }),
    register: (username, email, password) =>
      fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ username, email, password }),
      }).then(async (res) => {
        if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
        return res.json();
      }),
    logout: () =>
      fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      }).then(() => { setToken(null); }),
    refresh: tryRefresh,
    getHealth: () => request('GET', '/health'),
    listApps: () => request('GET', '/apps'),
    getApp: (name) => request('GET', `/apps/${name}`),
    updateAppConfig: (name, data) => request('POST', `/apps/${name}/config`, data),
    rollbackApp: (name) => request('POST', `/apps/${name}/rollback`),
    deleteApp: (name) => request('DELETE', `/apps/${name}`),
    setAppProject: (name, projectId) => request('PATCH', `/apps/${name}`, { project_id: projectId }),
    listDeployments: () => request('GET', '/deployments'),
    getDeployment: (id) => request('GET', `/deployments/${id}`),
    getDeploymentLogs: (id) => request('GET', `/deployments/${id}/logs`),
    listGitHubRepos: () => request('GET', '/github/repos'),
    importApp: (repo_name, repo_url, project_id) => request('POST', '/apps/import', { repo_name, repo_url, project_id }),
    listProjects: () => request('GET', '/projects'),
    getProject: (id) => request('GET', `/projects/${id}`),
    createProject: (name, description) => request('POST', '/projects', { name, description }),
    deleteProject: (id) => request('DELETE', `/projects/${id}`),
    getEnvVars: (name) => request('GET', `/apps/${name}/env`),
    setEnvVar: (name, key, value) => request('POST', `/apps/${name}/env`, { key, value }),
    deleteEnvVar: (name, key) => request('DELETE', `/apps/${name}/env/${key}`),
    listDomains: (name) => request('GET', `/apps/${name}/domains`),
    addDomain: (name, domain, ssl_enabled) => request('POST', `/apps/${name}/domains`, { domain, ssl_enabled }),
    deleteDomain: (name, id) => request('DELETE', `/apps/${name}/domains/${id}`),
    getMonitoringHealth: () => request('GET', '/monitoring/health'),
  };
})();