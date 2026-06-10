const express = require('express');

const router = express.Router();

const docs = {
  name: 'Sentinel API',
  version: '1.0.0',
  description: 'Self-hosted deployment platform API',
  base_url: '/',
  authentication: {
    methods: ['Bearer JWT (Authorization header)', 'Cookie (refresh token)', 'API Key (x-api-key header)'],
    endpoints: {
      register: { method: 'POST', path: '/auth/register', body: { username: 'string', email: 'string', password: 'string' } },
      login: { method: 'POST', path: '/auth/login', body: { username: 'string', password: 'string' } },
      refresh: { method: 'POST', path: '/auth/refresh' },
      logout: { method: 'POST', path: '/auth/logout' },
    },
  },
  endpoints: {
    health: {
      get_health: { method: 'GET', path: '/health', auth: false, description: 'Health check' },
    },
    apps: {
      list_apps: { method: 'GET', path: '/apps', auth: true },
      get_app: { method: 'GET', path: '/apps/:repoName', auth: true },
      update_config: { method: 'POST', path: '/apps/:repoName/config', auth: true, body: { health_path: 'string', container_port: 'number', host_port: 'number', project_id: 'number' } },
      update_app: { method: 'PATCH', path: '/apps/:repoName', auth: true, body: { project_id: 'number|null' } },
      rollback: { method: 'POST', path: '/apps/:repoName/rollback', auth: true },
      delete: { method: 'DELETE', path: '/apps/:repoName', auth: true },
      import: { method: 'POST', path: '/apps/import', auth: true, body: { repo_name: 'string', repo_url: 'string', project_id: 'number (optional)' } },
    },
    env_vars: {
      list: { method: 'GET', path: '/apps/:repoName/env', auth: true },
      set: { method: 'POST', path: '/apps/:repoName/env', auth: true, body: { key: 'string', value: 'string' } },
      delete: { method: 'DELETE', path: '/apps/:repoName/env/:key', auth: true },
      export: { method: 'GET', path: '/apps/:repoName/env/export', auth: true },
    },
    domains: {
      list: { method: 'GET', path: '/apps/:repoName/domains', auth: true },
      add: { method: 'POST', path: '/apps/:repoName/domains', auth: true, body: { domain: 'string', ssl_enabled: 'boolean' } },
      remove: { method: 'DELETE', path: '/apps/:repoName/domains/:id', auth: true },
    },
    projects: {
      list: { method: 'GET', path: '/projects', auth: true },
      create: { method: 'POST', path: '/projects', auth: true, body: { name: 'string', description: 'string (optional)' } },
      get: { method: 'GET', path: '/projects/:id', auth: true },
      update: { method: 'PATCH', path: '/projects/:id', auth: true },
      delete: { method: 'DELETE', path: '/projects/:id', auth: true },
    },
    teams: {
      list: { method: 'GET', path: '/teams', auth: true, roles: ['admin'] },
      create: { method: 'POST', path: '/teams', auth: true, roles: ['admin'], body: { name: 'string', description: 'string (optional)' } },
      get: { method: 'GET', path: '/teams/:id', auth: true },
      update: { method: 'PATCH', path: '/teams/:id', auth: true, roles: ['admin'] },
      delete: { method: 'DELETE', path: '/teams/:id', auth: true, roles: ['admin'] },
      add_member: { method: 'POST', path: '/teams/:id/members', auth: true, roles: ['admin'], body: { user_id: 'number', role: 'string (optional)' } },
      remove_member: { method: 'DELETE', path: '/teams/:id/members/:userId', auth: true, roles: ['admin'] },
      add_project: { method: 'POST', path: '/teams/:id/projects', auth: true, roles: ['admin'] },
      remove_project: { method: 'DELETE', path: '/teams/:id/projects/:projectId', auth: true, roles: ['admin'] },
    },
    users: {
      list: { method: 'GET', path: '/users', auth: true, roles: ['admin'] },
    },
    deployments: {
      list: { method: 'GET', path: '/deployments', auth: true },
      get: { method: 'GET', path: '/deployments/:id', auth: true },
      logs: { method: 'GET', path: '/deployments/:id/logs', auth: true },
      stream: { method: 'GET', path: '/deployments/:id/logs/stream', auth: true, note: 'SSE stream, accepts ?token= query param' },
    },
    github: {
      repos: { method: 'GET', path: '/github/repos', auth: true },
      auth: { method: 'GET', path: '/auth/github', auth: false, note: 'Redirects to GitHub OAuth' },
      callback: { method: 'GET', path: '/auth/github/callback', auth: false },
    },
    monitoring: {
      metrics: { method: 'GET', path: '/metrics', auth: false, note: 'Prometheus format' },
      health: { method: 'GET', path: '/monitoring/health', auth: true },
      containers: { method: 'GET', path: '/monitoring/containers', auth: true },
    },
    audit_log: {
      list: { method: 'GET', path: '/audit-log', auth: true, roles: ['admin'] },
      stats: { method: 'GET', path: '/audit-log/stats', auth: true, roles: ['admin'] },
    },
    webhook: {
      receive: { method: 'POST', path: '/webhook', auth: false, note: 'GitHub webhook receiver with HMAC verification' },
    },
  },
};

router.get('/api-docs', (req, res) => {
  res.json(docs);
});

module.exports = router;
