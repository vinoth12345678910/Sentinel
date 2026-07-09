const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const appConfigService = require('../services/appConfigService');
const deploymentService = require('../services/deploymentService');
const pipelineService = require('../services/pipelineService');
const { createDeployment } = require('../models/deployment');
const logger = require('../services/loggerService');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

function requireAppOwnership(repoName, userId) {
  if (userId === 0) return { id: -1 }; // admin API key — bypass ownership check
  const db = require('../db').getDb();
  return db.prepare('SELECT id FROM app_configs WHERE repo_name = ? AND user_id = ?').get(repoName, userId);
}

function latestDeploymentStatus(repoName) {
  try {
    const deps = require('../services/deploymentService').listByApp(repoName);
    if (deps.length === 0) return 'inactive';
    const latest = deps.reduce((a, b) => new Date(a.created_at) > new Date(b.created_at) ? a : b);
    return latest.state || 'inactive';
  } catch { return 'inactive'; }
}

router.get('/apps', authMiddleware, apiRateLimiter, (req, res) => {
  const db = require('../db').getDb();
  let rows;
  if (req.user.id === 0) {
    rows = db.prepare('SELECT repo_name FROM app_configs').all();
  } else {
    rows = db.prepare('SELECT repo_name FROM app_configs WHERE user_id = ?').all(req.user.id);
  }
  const apps = rows.map(r => {
    const cfg = appConfigService.getAppConfig(r.repo_name);
    if (cfg) cfg.status = latestDeploymentStatus(r.repo_name);
    return cfg;
  }).filter(Boolean);
  res.json(apps);
});

router.get('/apps/:repoName', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;
  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }
  if (!requireAppOwnership(repoName, req.user.id)) {
    return res.status(404).json({ message: 'App not found' });
  }
  const config = appConfigService.getAppConfig(repoName);
  if (config) config.status = latestDeploymentStatus(repoName);
  res.json(config);
});

router.post('/apps/:repoName/config', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;
  const { health_path, container_port, host_port, project_id } = req.body;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (container_port !== undefined) {
    const port = Number(container_port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return res.status(400).json({ message: 'container_port must be an integer between 1 and 65535' });
    }
  }

  if (host_port !== undefined) {
    const port = Number(host_port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return res.status(400).json({ message: 'host_port must be an integer between 1 and 65535' });
    }
  }

  if (health_path !== undefined) {
    if (typeof health_path !== 'string' || !health_path.startsWith('/')) {
      return res.status(400).json({ message: 'health_path must be a string starting with /' });
    }
  }

  if (project_id !== undefined) {
    const proj = require('../db').getDb().prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
    if (!proj) return res.status(400).json({ message: 'Project not found' });
  }

  const db = require('../db').getDb();
  const appRow = db.prepare('SELECT id FROM app_configs WHERE repo_name = ? AND user_id = ?').get(repoName, req.user.id);
  if (!appRow) {
    return res.status(404).json({ message: 'App not found' });
  }

  const updates = {};
  if (health_path !== undefined) updates.health_path = health_path;
  if (container_port !== undefined) updates.container_port = container_port;
  if (host_port !== undefined) updates.host_port = host_port;

  try {
    const updated = appConfigService.updateAppConfig(repoName, updates);
    if (project_id !== undefined) {
      db.prepare('UPDATE app_configs SET project_id = ? WHERE repo_name = ?').run(project_id, repoName);
      updated.project_id = project_id;
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update app config' });
  }
});

router.patch('/apps/:repoName', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;
  const { project_id } = req.body;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  const db = require('../db').getDb();
  const appRow = db.prepare('SELECT id FROM app_configs WHERE repo_name = ? AND user_id = ?').get(repoName, req.user.id);
  if (!appRow) return res.status(404).json({ message: 'App not found' });
  db.prepare('INSERT OR IGNORE INTO app_configs (repo_name) VALUES (?)').run(repoName);

  if (project_id !== undefined) {
    if (project_id === null || project_id === '') {
      db.prepare('UPDATE app_configs SET project_id = NULL WHERE repo_name = ?').run(repoName);
    } else {
      const proj = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
      if (!proj) return res.status(400).json({ message: 'Project not found' });
      db.prepare('UPDATE app_configs SET project_id = ? WHERE repo_name = ?').run(project_id, repoName);
    }
  }

  const updated = appConfigService.getAppConfig(repoName);
  const row = db.prepare('SELECT project_id FROM app_configs WHERE repo_name = ?').get(repoName);
  updated.project_id = row ? row.project_id : null;

  res.json(updated);
});

router.patch('/apps/:repoName/domain', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;
  const { domain } = req.body;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'domain is required' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

  const update = { domain };
  if (req.body.ssl !== undefined) {
    update.ssl = Boolean(req.body.ssl);
  }

  try {
    const updated = appConfigService.updateAppConfig(repoName, update);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update domain' });
  }
});

// PUT /apps/:repoName/previews/:branch — register/update a preview deployment
router.put('/apps/:repoName/previews/:branch', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName, branch } = req.params;
  const { host_port, domain, deployment_id } = req.body;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!branch || !host_port || !domain || !deployment_id) {
    return res.status(400).json({ message: 'Missing required fields: host_port, domain, deployment_id' });
  }

  const appRow = requireAppOwnership(repoName, req.user.id);
  if (!appRow) return res.status(404).json({ message: 'App not found' });
  const app = appConfigService.getAppConfig(repoName);

  const previews = app.previews || {};
  previews[branch] = { host_port, domain, deployment_id, created_at: new Date().toISOString() };

  try {
    const updated = appConfigService.updateAppConfig(repoName, { previews });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to register preview' });
  }
});

// DELETE /apps/:repoName/previews/:branch — remove a preview deployment
router.delete('/apps/:repoName/previews/:branch', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName, branch } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const app = appConfigService.getAppConfig(repoName);

  const previews = app.previews || {};
  if (!previews[branch]) return res.status(404).json({ message: 'Preview not found for this branch' });

  delete previews[branch];

  try {
    const updated = appConfigService.updateAppConfig(repoName, { previews });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove preview' });
  }
});

// GET /apps/:repoName/custom-domains — list custom domains
router.get('/apps/:repoName/custom-domains', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const app = appConfigService.getAppConfig(repoName);

  const customDomains = app.custom_domains || {};
  const list = Object.entries(customDomains).map(([domain, info]) => ({
    id: domain,
    domain,
    ssl_enabled: info.ssl || false,
    verified: info.verified || false,
    created_at: info.created_at,
  }));

  res.json(list);
});

// POST /apps/:repoName/custom-domains/:domain — add a custom domain
router.post('/apps/:repoName/custom-domains/:domain', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName, domain } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  // Basic domain validation
  if (!domain || !/^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(domain)) {
    return res.status(400).json({ message: 'Invalid domain format' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const app = appConfigService.getAppConfig(repoName);

  const customDomains = app.custom_domains || {};
  if (customDomains[domain]) {
    return res.status(409).json({ message: 'Domain already added' });
  }

  customDomains[domain] = {
    ssl: false,
    verified: false,
    created_at: new Date().toISOString(),
  };

  try {
    const updated = appConfigService.updateAppConfig(repoName, { custom_domains: customDomains });
    res.status(201).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add custom domain' });
  }
});

// DELETE /apps/:repoName/custom-domains/:domain — remove a custom domain
router.delete('/apps/:repoName/custom-domains/:domain', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName, domain } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const app = appConfigService.getAppConfig(repoName);

  const customDomains = app.custom_domains || {};
  if (!customDomains[domain]) {
    return res.status(404).json({ message: 'Custom domain not found' });
  }

  delete customDomains[domain];

  try {
    const updated = appConfigService.updateAppConfig(repoName, { custom_domains: customDomains });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to remove custom domain' });
  }
});

router.get('/apps/:repoName/db-check', authMiddleware, apiRateLimiter, (req, res) => {
  const db = require('../db').getDb();
  const row = db.prepare('SELECT * FROM app_configs WHERE repo_name = ? AND user_id = ?').get(req.params.repoName, req.user.id);
  res.json({ row });
});

// GET /apps/:repoName/deployments — list deployments for an app
router.get('/apps/:repoName/deployments', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

  const deployments = deploymentService.listByApp(repoName);
  res.json(deployments);
});

// POST /apps/:repoName/deployments/:deploymentId/rollback — rollback to a specific deployment
router.post('/apps/:repoName/deployments/:deploymentId/rollback', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName, deploymentId } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const appCfg = appConfigService.getAppConfig(repoName);

  // Verify target deployment exists and was successful
  const targetDeployment = deploymentService.read(deploymentId);
  if (!targetDeployment) {
    return res.status(404).json({ message: 'Target deployment not found' });
  }
  if (targetDeployment.repo_name !== repoName) {
    return res.status(400).json({ message: 'Deployment does not belong to this app' });
  }
  if (targetDeployment.state !== 'SUCCESS') {
    return res.status(400).json({ message: 'Can only roll back to a successful deployment' });
  }

  const timestamp = Date.now().toString();
  const deployment = createDeployment({
    repo_name: repoName,
    branch: 'rollback',
    commit_hash: targetDeployment.commit_hash,
    pusher: 'api',
    timestamp,
  });

  deployment.state = 'ROLLING_BACK';
  deploymentService.create(deployment);

  const hostPort = appCfg.host_port || 3000;
  const containerPort = appCfg.container_port || 3000;
  const healthPath = appCfg.health_path || '/health';

  pipelineService.triggerRollback(repoName, deployment.deployment_id, hostPort, containerPort, healthPath);

  logger.log(repoName, 'INFO', deployment.deployment_id, `Rollback to deployment ${deploymentId} initiated`);
  res.status(200).json({ deployment_id: deployment.deployment_id, target_deployment: deploymentId, message: 'Rollback initiated' });
});

router.post('/apps/:repoName/rollback', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
  const appCfg = appConfigService.getAppConfig(repoName);

  const timestamp = Date.now().toString();
  const deployment = createDeployment({
    repo_name: repoName,
    branch: 'rollback',
    commit_hash: 'rollback',
    pusher: 'api',
    timestamp,
  });

  deployment.state = 'ROLLING_BACK';
  deploymentService.create(deployment);

  const hostPort = appCfg.host_port || 3000;
  const containerPort = appCfg.container_port || 3000;
  const healthPath = appCfg.health_path || '/health';

  pipelineService.triggerRollback(repoName, deployment.deployment_id, hostPort, containerPort, healthPath);

  logger.log(repoName, 'INFO', deployment.deployment_id, 'Rollback initiated via API');
  res.status(200).json({ deployment_id: deployment.deployment_id, message: 'Rollback initiated' });
});

module.exports = router;
