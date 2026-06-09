const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const appConfigService = require('../services/appConfigService');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

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
  const { health_path, container_port, host_port } = req.body;

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

  const allowed = ['health_path', 'container_port', 'host_port'];
  const extra = Object.keys(req.body).filter(k => !allowed.includes(k));
  if (extra.length > 0) {
    return res.status(400).json({ message: 'Unexpected fields' });
  }

  const existing = appConfigService.getAppConfig(repoName);
  if (!existing) {
    return res.status(404).json({ message: 'App not found' });
  }

  const updates = {};
  if (health_path !== undefined) updates.health_path = health_path;
  if (container_port !== undefined) updates.container_port = container_port;
  if (host_port !== undefined) updates.host_port = host_port;

  try {
    const updated = appConfigService.updateAppConfig(repoName, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update app config' });
  }
});

module.exports = router;
