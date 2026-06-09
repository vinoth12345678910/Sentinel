const express = require('express');
const crypto = require('crypto');
const config = require('../config');
const { createDeployment } = require('../models/deployment');
const deploymentService = require('../services/deploymentService');
const appConfigService = require('../services/appConfigService');
const pipelineService = require('../services/pipelineService');
const logger = require('../services/loggerService');
const { webhookRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

router.post('/webhook', webhookRateLimiter, express.raw({ type: 'application/json', limit: '1mb' }), (req, res) => {
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
    return res.status(400).json({ message: 'Missing request body' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf-8'));
  } catch (e) {
    return res.status(400).json({ message: 'Invalid JSON payload' });
  }

  const repoName = payload.repository && payload.repository.name;
  if (!repoName) {
    logger.log('unknown', 'ERROR', '-', 'Webhook received with missing repository name');
    return res.status(400).json({ message: 'Invalid payload: missing repository name' });
  }

  if (!validateRepoName(repoName)) {
    logger.log(repoName, 'ERROR', '-', 'Invalid repository name rejected');
    return res.status(400).json({ message: 'Invalid repository name' });
  }

  logger.log(repoName, 'INFO', '-', 'Webhook received');

  const sig = req.headers['x-hub-signature-256'];
  if (!sig) {
    logger.log(repoName, 'ERROR', '-', 'Signature validation failed: missing x-hub-signature-256 header');
    return res.status(400).json({ message: 'Missing signature header' });
  }

  const hmac = crypto.createHmac('sha256', config.GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(sig))) {
      logger.log(repoName, 'ERROR', '-', 'Signature validation failed: invalid signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }
  } catch {
    logger.log(repoName, 'ERROR', '-', 'Signature validation failed: invalid signature format');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const ref = payload.ref || '';
  const branch = ref.replace('refs/heads/', '');

  if (branch !== 'main') {
    logger.log(repoName, 'INFO', '-', `Non-main branch ignored: ${branch}`);
    return res.status(200).json({ message: 'Ignored non-main branch' });
  }

  const commitHash = payload.after || '';
  const pusher = payload.pusher ? payload.pusher.name : 'unknown';
  const repoUrl = payload.repository && (payload.repository.clone_url || payload.repository.html_url) || '';
  const timestamp = (payload.repository && payload.repository.pushed_at) || Date.now().toString();

  try {
    appConfigService.createAppConfig(repoName, repoUrl);
  } catch (err) {
    logger.log(repoName, 'ERROR', '-', `Failed to create app config: ${err.message}`);
    return res.status(500).json({ message: 'Failed to create app config' });
  }

  try {
    const deployment = createDeployment({ repo_name: repoName, branch, commit_hash: commitHash, pusher, timestamp });
    deploymentService.create(deployment);

    const appCfg = appConfigService.getAppConfig(repoName);
    let hostPort = appCfg && appCfg.host_port || null;
    const containerPort = appCfg && appCfg.container_port || 3000;
    const healthPath = appCfg && appCfg.health_path || '/health';

    if (!hostPort) {
      const allConfigs = appConfigService.getAllAppConfigs();
      const usedPorts = allConfigs
        .filter(c => c.repo_name !== repoName && c.host_port)
        .map(c => c.host_port);
      hostPort = containerPort;
      while (usedPorts.includes(hostPort)) {
        hostPort++;
      }
      appConfigService.updateAppConfig(repoName, { host_port: hostPort });
      logger.log(repoName, 'INFO', deployment.deployment_id, `Auto-assigned host_port: ${hostPort}`);
    }

    pipelineService.trigger(repoName, deployment.deployment_id, repoUrl, commitHash, hostPort, containerPort, healthPath);
    res.status(200).json({ deployment_id: deployment.deployment_id });
  } catch (err) {
    logger.log(repoName, 'ERROR', '-', `Deployment creation failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to create deployment' });
  }
});

module.exports = router;
