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

function updateState(deploymentId, newState) {
  const reposDir = config.REPOS_BASE_PATH;
  if (!fs.existsSync(reposDir)) return null;
  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployPath = path.join(reposDir, repo, 'deployments', `${deploymentId}.json`);
    if (fs.existsSync(deployPath)) {
      const deployment = JSON.parse(fs.readFileSync(deployPath, 'utf-8'));
      deployment.state = newState;
      deployment.updated_at = new Date().toISOString();
      fs.writeFileSync(deployPath, JSON.stringify(deployment, null, 2));
      logger.log(deployment.repo_name, 'INFO', deploymentId, `State updated to ${newState}`);
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

module.exports = { create, read, updateState, listAll };
