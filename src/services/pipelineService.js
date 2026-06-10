const { spawn } = require('child_process');
const path = require('path');
const config = require('../config');
const logger = require('./loggerService');
const deploymentService = require('./deploymentService');

function getEnvFilePath(repoName) {
  const candidate = path.join(config.REPOS_BASE_PATH, repoName, '.env.deployment');
  try {
    if (require('fs').existsSync(candidate)) return candidate;
  } catch {}
  return '';
}

function trigger(repoName, deploymentId, repoUrl, commitHash, hostPort, containerPort, healthPath, branch) {
  const scriptPath = path.join(config.SCRIPTS_PATH, 'pipeline.sh');
  const envFile = getEnvFilePath(repoName);
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  const logFile = path.join(logDir, 'pipeline.log');

  const env = Object.assign({}, process.env, {
    BACKEND_URL: config.BACKEND_URL,
    SENTINEL_API_KEY: config.SENTINEL_API_KEY,
    REPOS_DIR: config.REPOS_BASE_PATH,
    BASE_DOMAIN: config.BASE_DOMAIN,
  });

  let child;
  try {
    child = spawn('bash', [scriptPath, repoName, deploymentId, repoUrl, commitHash, hostPort, containerPort, healthPath, envFile, branch || ''], {
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

function triggerRollback(repoName, deploymentId, hostPort, containerPort, healthPath) {
  const healthUrl = `http://localhost:${hostPort}${healthPath || '/health'}`;
  const scriptPath = path.join(config.SCRIPTS_PATH, 'rollback.sh');
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  const logFile = path.join(logDir, 'rollback.log');

  const env = Object.assign({}, process.env, {
    BACKEND_URL: config.BACKEND_URL,
    SENTINEL_API_KEY: config.SENTINEL_API_KEY,
    REPOS_DIR: config.REPOS_BASE_PATH,
  });

  deploymentService.updateState(deploymentId, 'ROLLBACK_STARTED');

  let child;
  try {
    child = spawn('bash', [scriptPath, repoName, deploymentId, healthUrl, hostPort, containerPort], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
      cwd: config.SCRIPTS_PATH,
      timeout: 300000,
    });
  } catch (err) {
    logger.log(repoName, 'ERROR', deploymentId, `Failed to spawn rollback: ${err.message}`);
    deploymentService.updateState(deploymentId, 'FAILED');
    return;
  }

  child.unref();

  const stream = require('fs').createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  child.on('error', (err) => {
    logger.log(repoName, 'ERROR', deploymentId, `Rollback process error: ${err.message}`);
    deploymentService.updateState(deploymentId, 'FAILED');
  });

  logger.log(repoName, 'INFO', deploymentId, 'Rollback triggered');
}

module.exports = { trigger, triggerRollback };
