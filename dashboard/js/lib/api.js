(function () {
  'use strict';

  class SentinelAPI {
    constructor() {
      this.baseURL = '';
      this.token = null;
    }

    setToken(token) {
      this.token = token;
    }

    clearToken() {
      this.token = null;
    }

    isAuthenticated() {
      return !!this.token;
    }

    async request(method, path, body, options = {}) {
      const headers = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      if (method !== 'GET' && body !== undefined && body !== null) {
        headers['Content-Type'] = 'application/json';
      }

      const fetchOptions = {
        method,
        headers,
        ...options,
      };

      if (method !== 'GET' && body !== undefined && body !== null) {
        fetchOptions.body = JSON.stringify(body);
      }

      let response = await fetch(`${this.baseURL}${path}`, fetchOptions);

      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (!refreshed) {
          this.clearToken();
          return null;
        }
        headers['Authorization'] = `Bearer ${this.token}`;
        fetchOptions.headers = headers;
        if (method !== 'GET' && body !== undefined && body !== null) {
          fetchOptions.body = JSON.stringify(body);
        }
        response = await fetch(`${this.baseURL}${path}`, fetchOptions);
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = null;
        }
        const err = new Error(
          errorData && errorData.message
            ? errorData.message
            : `Request failed with status ${response.status}`
        );
        err.status = response.status;
        err.message =
          errorData && errorData.message
            ? errorData.message
            : `Request failed with status ${response.status}`;
        err.data = errorData;
        throw err;
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    }

    get(path, params) {
      let url = path;
      if (params) {
        const qs = Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(
            ([k, v]) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
          )
          .join('&');
        if (qs) {
          url += `?${qs}`;
        }
      }
      return this.request('GET', url);
    }

    post(path, body) {
      return this.request('POST', path, body);
    }

    patch(path, body) {
      return this.request('PATCH', path, body);
    }

    delete(path) {
      return this.request('DELETE', path);
    }

    login(username, password) {
      return this.post('/auth/login', { username, password });
    }

    register(username, email, password) {
      return this.post('/auth/register', { username, email, password });
    }

    async refreshToken() {
      try {
        const data = await this.post('/auth/refresh');
        if (data && data.accessToken) {
          this.setToken(data.accessToken);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }

    logout() {
      return this.post('/auth/logout');
    }

    getMe() {
      return this.get('/users/me');
    }

    listApps() {
      return this.get('/apps');
    }

    getApp(name) {
      return this.get(`/apps/${encodeURIComponent(name)}`);
    }

    updateAppConfig(name, data) {
      return this.post(
        `/apps/${encodeURIComponent(name)}/config`,
        data
      );
    }

    patchApp(name, data) {
      return this.patch(
        `/apps/${encodeURIComponent(name)}`,
        data
      );
    }

    rollbackApp(name) {
      return this.post(
        `/apps/${encodeURIComponent(name)}/rollback`
      );
    }

    rollbackToDeployment(name, deploymentId) {
      return this.post(
        `/apps/${encodeURIComponent(name)}/deployments/${encodeURIComponent(deploymentId)}/rollback`
      );
    }

    deleteApp(name) {
      return this.delete(`/apps/${encodeURIComponent(name)}`);
    }

    updateAppDomain(name, domain) {
      return this.patch(
        `/apps/${encodeURIComponent(name)}/domain`,
        { domain }
      );
    }

    listCustomDomains(name) {
      return this.get(
        `/apps/${encodeURIComponent(name)}/custom-domains`
      );
    }

    addCustomDomain(name, domain) {
      return this.post(
        `/apps/${encodeURIComponent(name)}/custom-domains/${encodeURIComponent(domain)}`
      );
    }

    removeCustomDomain(name, domain) {
      return this.delete(
        `/apps/${encodeURIComponent(name)}/custom-domains/${encodeURIComponent(domain)}`
      );
    }

    registerPreview(name, branch, data) {
      return this.put
        ? this.put(
            `/apps/${encodeURIComponent(name)}/previews/${encodeURIComponent(branch)}`,
            data
          )
        : this.request(
            'PUT',
            `/apps/${encodeURIComponent(name)}/previews/${encodeURIComponent(branch)}`,
            data
          );
    }

    removePreview(name, branch) {
      return this.delete(
        `/apps/${encodeURIComponent(name)}/previews/${encodeURIComponent(branch)}`
      );
    }

    listEnvVars(name) {
      return this.get(`/apps/${encodeURIComponent(name)}/env`);
    }

    setEnvVar(name, key, value) {
      return this.post(`/apps/${encodeURIComponent(name)}/env`, {
        key,
        value,
      });
    }

    deleteEnvVar(name, key) {
      return this.delete(
        `/apps/${encodeURIComponent(name)}/env/${encodeURIComponent(key)}`
      );
    }

    exportEnvVars(name) {
      return this.get(
        `/apps/${encodeURIComponent(name)}/env/export`
      );
    }

    listDeployments() {
      return this.get('/deployments');
    }

    getDeployment(id) {
      return this.get(
        `/deployments/${encodeURIComponent(id)}`
      );
    }

    listAppDeployments(name) {
      return this.get(
        `/apps/${encodeURIComponent(name)}/deployments`
      );
    }

    getDeploymentLogs(id) {
      return this.get(
        `/deployments/${encodeURIComponent(id)}/logs`
      );
    }

    listProjects() {
      return this.get('/projects');
    }

    getProject(id) {
      return this.get(`/projects/${encodeURIComponent(id)}`);
    }

    createProject(name, description) {
      return this.post('/projects', { name, description });
    }

    updateProject(id, data) {
      return this.patch(
        `/projects/${encodeURIComponent(id)}`,
        data
      );
    }

    deleteProject(id) {
      return this.delete(`/projects/${encodeURIComponent(id)}`);
    }

    listTeams() {
      return this.get('/teams');
    }

    getTeam(id) {
      return this.get(`/teams/${encodeURIComponent(id)}`);
    }

    createTeam(name, description) {
      return this.post('/teams', { name, description });
    }

    updateTeam(id, data) {
      return this.patch(`/teams/${encodeURIComponent(id)}`, data);
    }

    deleteTeam(id) {
      return this.delete(`/teams/${encodeURIComponent(id)}`);
    }

    addTeamMember(teamId, data) {
      return this.post(
        `/teams/${encodeURIComponent(teamId)}/members`,
        data
      );
    }

    removeTeamMember(teamId, userId) {
      return this.delete(
        `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`
      );
    }

    addTeamProject(teamId, projectId) {
      return this.post(
        `/teams/${encodeURIComponent(teamId)}/projects`,
        { project_id: projectId }
      );
    }

    removeTeamProject(teamId, projectId) {
      return this.delete(
        `/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projectId)}`
      );
    }

    listUsers() {
      return this.get('/users');
    }

    updateUserRole(id, role) {
      return this.patch(`/users/${encodeURIComponent(id)}`, {
        role,
      });
    }

    getUser(id) {
      return this.get('/users/me');
    }

    listGithubRepos() {
      return this.get('/github/repos');
    }

    importApp(repoName, repoUrl, projectId) {
      return this.post('/apps/import', {
        repo_name: repoName,
        repo_url: repoUrl,
        project_id: projectId,
      });
    }

    getHealth() {
      return this.get('/health');
    }

    getMonitoringHealth() {
      return this.get('/monitoring/health');
    }

    getContainerMetrics() {
      return this.get('/monitoring/containers');
    }

    listAuditLog(params) {
      return this.get('/audit-log', params);
    }

    getAuditLogStats() {
      return this.get('/audit-log/stats');
    }

    getDeploymentStreamUrl(id) {
      return `/deployments/${encodeURIComponent(id)}/logs/stream?token=${encodeURIComponent(this.token || '')}`;
    }

    getMetricsUrl() {
      return '/metrics';
    }
  }

  window.SentinelAPI = new SentinelAPI();
})();
