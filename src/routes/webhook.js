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
const { writeEnvFile } = require('./env');

const router = express.Router();

function sanitizeBranch(branch) {
  return branch
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}

function findFreePort(repoName, excludePort) {
  const allConfigs = appConfigService.getAllAppConfigs();
  const usedPorts = allConfigs
    .flatMap(c => {
      const ports = [];
      if (c.repo_name !== repoName && c.host_port) ports.push(c.host_port);
      if (c.previews) {
        Object.values(c.previews).forEach(p => {
          if (p.host_port) ports.push(p.host_port);
        });
      }
      return ports;
    });
  let port = excludePort || 3000;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

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

  const expectedSig = 'sha256=' + crypto.createHmac('sha256', config.GITHUB_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    logger.log(repoName, 'ERROR', '-', 'Signature validation failed: invalid signature');
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const ref = payload.ref || '';
  const branch = ref.replace('refs/heads/', '');

  if (!branch) {
    logger.log(repoName, 'INFO', '-', 'Ignored non-branch push');
    return res.status(200).json({ message: 'Ignored non-branch push' });
  }

  // Handle branch deletion — clean up preview
  if (payload.deleted) {
    logger.log(repoName, 'INFO', '-', `Branch deleted: ${branch}`);
    const app = appConfigService.getAppConfig(repoName);
    if (app && app.previews && app.previews[branch]) {
      const prev = app.previews[branch];
      logger.log(repoName, 'INFO', '-', `Cleaning up preview for ${branch} (port ${prev.host_port})`);
      // Remove nginx config
      const nginxFile = `sentinel-${prev.domain.replace(/[^a-zA-Z0-9-]/g, '-')}.conf`;
      require('child_process').exec(`rm -f /etc/nginx/sites-available/${nginxFile} /etc/nginx/sites-enabled/${nginxFile}`);
      require('child_process').exec('nginx -s reload 2>/dev/null || systemctl reload nginx 2>/dev/null || true');
      // Stop and remove Docker container
      require('child_process').exec(`docker stop ${prev.deployment_id} 2>/dev/null; docker rm ${prev.deployment_id} 2>/dev/null || true`);
      // Remove preview from app config
      const previews = app.previews || {};
      delete previews[branch];
      appConfigService.updateAppConfig(repoName, { previews });
      logger.log(repoName, 'INFO', '-', `Preview cleaned up for ${branch}`);
    }
    return res.status(200).json({ message: 'Branch deletion handled' });
  }

  const commitHash = payload.after || '';
  if (commitHash && !/^[a-f0-9]{40}$/i.test(commitHash)) {
    logger.log(repoName, 'ERROR', '-', `Invalid commit hash format: ${commitHash}`);
    return res.status(400).json({ message: 'Invalid commit hash' });
  }

  const pusher = payload.pusher ? payload.pusher.name : 'unknown';
  const repoUrl = payload.repository && (payload.repository.clone_url || payload.repository.html_url) || '';
  if (repoUrl && !repoUrl.startsWith('https://github.com/')) {
    logger.log(repoName, 'ERROR', '-', `Invalid repository URL (not github.com): ${repoUrl}`);
    return res.status(400).json({ message: 'Repository URL must be from github.com' });
  }

  const isPreview = branch !== 'main';

  try {
    appConfigService.createAppConfig(repoName, repoUrl);
    if (!isPreview) {
      const domain = `${repoName.toLowerCase()}.${config.BASE_DOMAIN}`;
      appConfigService.updateAppConfig(repoName, { domain });
      if (repoName.toLowerCase() === 'sentinel') {
        appConfigService.updateAppConfig(repoName, { is_sentinel: true, container_port: null });
      }
    }
  } catch (err) {
    logger.log(repoName, 'ERROR', '-', `Failed to create app config: ${err.message}`);
    return res.status(500).json({ message: 'Failed to create app config' });
  }

  try {
    const deployment = createDeployment({ repo_name: repoName, branch, commit_hash: commitHash, pusher, timestamp: payload.repository && payload.repository.pushed_at || Date.now().toString() });
    deploymentService.create(deployment);

    const appCfg = appConfigService.getAppConfig(repoName);

    let hostPort;
    const containerPort = appCfg && appCfg.container_port || 3000;
    const healthPath = appCfg && appCfg.health_path || '/health';

    if (isPreview) {
      // Allocate a port for this preview (re-use existing if already deployed)
      const existingPreview = appCfg && appCfg.previews && appCfg.previews[branch];
      if (existingPreview && existingPreview.host_port) {
        hostPort = existingPreview.host_port;
      } else {
        hostPort = findFreePort(repoName, containerPort);
      }
    } else {
      hostPort = appCfg && appCfg.host_port || null;
      if (!hostPort) {
        hostPort = findFreePort(repoName, containerPort);
        appConfigService.updateAppConfig(repoName, { host_port: hostPort });
        logger.log(repoName, 'INFO', deployment.deployment_id, `Auto-assigned host_port: ${hostPort}`);
      }
    }

    // Write env vars to .env.deployment before triggering pipeline
    try { writeEnvFile(repoName); } catch (e) { logger.log(repoName, 'WARN', '-', `Failed to write env file: ${e.message}`); }

    pipelineService.trigger(repoName, deployment.deployment_id, repoUrl, commitHash, hostPort, containerPort, healthPath, branch);
    res.status(200).json({ deployment_id: deployment.deployment_id, is_preview: isPreview });
  } catch (err) {
    logger.log(repoName, 'ERROR', '-', `Deployment creation failed: ${err.message}`);
    res.status(500).json({ message: 'Failed to create deployment' });
  }
});

module.exports = router;
