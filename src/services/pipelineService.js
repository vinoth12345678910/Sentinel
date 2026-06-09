const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');
const logger = require('./loggerService');

function trigger(repoName, deploymentId, repoUrl, commitHash, hostPort, containerPort, healthPath) {
  const scriptPath = path.join(config.SCRIPTS_PATH, 'pipeline.sh');
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  const logFile = path.join(logDir, 'pipeline.log');

  const env = Object.assign({}, process.env, {
    BACKEND_URL: config.BACKEND_URL,
    SENTINEL_API_KEY: config.SENTINEL_API_KEY,
    REPOS_DIR: config.REPOS_BASE_PATH,
  });

  let child;
  try {
    child = spawn('bash', [scriptPath, repoName, deploymentId, repoUrl, commitHash, hostPort, containerPort, healthPath], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
      cwd: config.SCRIPTS_PATH,
      timeout: 600000,
    });
  } catch (err) {
    logger.log(repoName, 'ERROR', deploymentId, `Failed to spawn pipeline: ${err.message}`);
    return;
  }

  child.unref();

  const stream = require('fs').createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  child.on('error', (err) => {
    logger.log(repoName, 'ERROR', deploymentId, `Pipeline process error: ${err.message}`);
  });

  logger.log(repoName, 'INFO', deploymentId, 'Pipeline triggered');
}

module.exports = { trigger };
