const API = (() => {
  const BASE = '/dashboard';

  function getAuthHeaders() {
    const token = localStorage.getItem('sentinel_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['x-api-key'] = token;
    return headers;
  }

  async function request(method, path, body) {
    const opts = { method, headers: getAuthHeaders() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }

  return {
    getHealth: () => request('GET', '/health'),
    listApps: () => request('GET', '/apps'),
    getApp: (name) => request('GET', `/apps/${name}`),
    updateAppConfig: (name, data) => request('POST', `/apps/${name}/config`, data),
    rollbackApp: (name) => request('POST', `/apps/${name}/rollback`),
    listDeployments: () => request('GET', '/deployments'),
    getDeployment: (id) => request('GET', `/deployments/${id}`),
    getDeploymentLogs: (id) => request('GET', `/deployments/${id}/logs`),
  };
})();
