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

router.get('/apps', authMiddleware, apiRateLimiter, (req, res) => {
  const apps = appConfigService.getAllAppConfigs();
  res.json(apps);
});

router.get('/apps/:repoName', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;
  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }
  const config = appConfigService.getAppConfig(repoName);
  if (!config) {
    return res.status(404).json({ message: 'App not found' });
  }
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
    const proj = require('../db').getDb().prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
    if (!proj) return res.status(400).json({ message: 'Project not found' });
  }

  const existing = appConfigService.getAppConfig(repoName);
  if (!existing) {
    return res.status(404).json({ message: 'App not found' });
  }

  const db = require('../db').getDb();
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

  const app = appConfigService.getAppConfig(repoName);
  if (!app) return res.status(404).json({ message: 'App not found' });

  const db = require('../db').getDb();
  db.prepare('INSERT OR IGNORE INTO app_configs (repo_name) VALUES (?)').run(repoName);

  if (project_id !== undefined) {
    if (project_id === null || project_id === '') {
      db.prepare('UPDATE app_configs SET project_id = NULL WHERE repo_name = ?').run(repoName);
    } else {
      const proj = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
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

  const app = appConfigService.getAppConfig(repoName);
  if (!app) return res.status(404).json({ message: 'App not found' });

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

  const app = appConfigService.getAppConfig(repoName);
  if (!app) return res.status(404).json({ message: 'App not found' });

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

  const app = appConfigService.getAppConfig(repoName);
  if (!app) return res.status(404).json({ message: 'App not found' });

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

router.get('/apps/:repoName/db-check', authMiddleware, apiRateLimiter, (req, res) => {
  const db = require('../db').getDb();
  const row = db.prepare('SELECT * FROM app_configs WHERE repo_name = ?').get(req.params.repoName);
  res.json({ row });
});

router.post('/apps/:repoName/rollback', authMiddleware, apiRateLimiter, (req, res) => {
  const { repoName } = req.params;

  if (!validateRepoName(repoName)) {
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  const appCfg = appConfigService.getAppConfig(repoName);
  if (!appCfg) {
    return res.status(404).json({ message: 'App not found' });
  }

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
