const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./loggerService');

function getDeploymentDir(repoName) {
  return path.join(config.REPOS_BASE_PATH, repoName, 'deployments');
}

function create(deployment) {
  const dir = getDeploymentDir(deployment.repo_name);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${deployment.deployment_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(deployment, null, 2));
  logger.log(deployment.repo_name, 'INFO', deployment.deployment_id, 'Deployment record created');
  return deployment;
}

function read(deploymentId) {
  const reposDir = config.REPOS_BASE_PATH;
  if (!fs.existsSync(reposDir)) return null;
  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployPath = path.join(reposDir, repo, 'deployments', `${deploymentId}.json`);
    if (fs.existsSync(deployPath)) {
      return JSON.parse(fs.readFileSync(deployPath, 'utf-8'));
    }
  }
  return null;
}

function isFailureState(state) {
  return state && (state.startsWith('FAILED') || state === 'ROLLED_BACK');
}

function sendAlertWebhook(deployment) {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const https = require('https');
    const body = JSON.stringify({
      type: 'deployment_failed',
      deployment_id: deployment.deployment_id,
      repo_name: deployment.repo_name,
      state: deployment.state,
      failure_reason: deployment.failure_reason || '',
      timestamp: new Date().toISOString(),
    });
    const url = new URL(webhookUrl);
    const opts = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    };
    const req = https.request(opts, () => {});
    req.on('error', () => {});
    req.write(body);
    req.end();
  } catch {}
}

function updateState(deploymentId, newState, failureReason) {
  const reposDir = config.REPOS_BASE_PATH;
  if (!fs.existsSync(reposDir)) return null;
  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployPath = path.join(reposDir, repo, 'deployments', `${deploymentId}.json`);
    if (fs.existsSync(deployPath)) {
      const deployment = JSON.parse(fs.readFileSync(deployPath, 'utf-8'));
      deployment.state = newState;
      deployment.updated_at = new Date().toISOString();
      if (failureReason !== undefined && failureReason !== null) {
        deployment.failure_reason = failureReason;
      }
      fs.writeFileSync(deployPath, JSON.stringify(deployment, null, 2));
      logger.log(deployment.repo_name, 'INFO', deploymentId, `State updated to ${newState}${failureReason ? `: ${failureReason}` : ''}`);

      if (isFailureState(newState)) {
        sendAlertWebhook(deployment);
      }

      return deployment;
    }
  }
  return null;
}

function listAll() {
  const reposDir = config.REPOS_BASE_PATH;
  if (!fs.existsSync(reposDir)) return [];
  const all = [];
  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployDir = path.join(reposDir, repo, 'deployments');
    if (!fs.existsSync(deployDir)) continue;
    const files = fs.readdirSync(deployDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(deployDir, file), 'utf-8');
      all.push(JSON.parse(content));
    }
  }
  all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return all;
}

function listByApp(repoName) {
  const dir = getDeploymentDir(repoName);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const deployments = files.map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')); } catch { return null; }
  }).filter(Boolean);
  deployments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return deployments;
}

module.exports = { create, read, updateState, listAll, listByApp };
