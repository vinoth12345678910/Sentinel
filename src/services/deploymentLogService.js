const fs = require('fs');
const path = require('path');
const config = require('../config');

const MAX_LINES = 500;

function getLogPaths(repoName) {
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  return [
    path.join(logDir, 'sentinel.log'),
    path.join(logDir, 'pipeline.log'),
    path.join(logDir, 'rollback.log'),
  ];
}

function readLogs(deploymentId) {
  const reposDir = config.REPOS_BASE_PATH;
  if (!fs.existsSync(reposDir)) return [];

  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployPath = path.join(reposDir, repo, 'deployments', `${deploymentId}.json`);
    if (!fs.existsSync(deployPath)) continue;

    try {
      const deployment = JSON.parse(fs.readFileSync(deployPath, 'utf-8'));
      const repoName = deployment.repo_name;
      const logPaths = getLogPaths(repoName);
      const lines = [];

      for (const logPath of logPaths) {
        if (!fs.existsSync(logPath)) continue;
        const content = fs.readFileSync(logPath, 'utf-8');
        const fileLines = content.split('\n').filter(Boolean);
        for (const line of fileLines) {
          if (line.includes(deploymentId)) {
            lines.push(line);
          }
        }
      }

      if (lines.length === 0) {
        for (const logPath of logPaths) {
          if (!fs.existsSync(logPath)) continue;
          const content = fs.readFileSync(logPath, 'utf-8');
          const fileLines = content.split('\n').filter(Boolean);
          lines.push(...fileLines.slice(-MAX_LINES));
        }
      }

      return lines;
    } catch (e) {
      return [];
    }
  }

  return [];
}

module.exports = { readLogs };
