const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('./loggerService');
const deploymentService = require('./deploymentService');

const PIPELINE_TIMEOUT = 600000;

function getEnvFilePath(repoName) {
  const candidate = path.join(config.REPOS_BASE_PATH, repoName, '.env.deployment');
  try {
    if (require('fs').existsSync(candidate)) return candidate;
  } catch {}
  return '';
}

function writeToLog(logFile, msg) {
  try {
    fs.mkdirSync(path.dirname(logFile), { recursive: true });
    fs.appendFileSync(logFile, `${msg}\n`, 'utf-8');
  } catch {}
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

  let timeoutId;

  let child;
  try {
    child = spawn('bash', [scriptPath, repoName, deploymentId, repoUrl, commitHash, hostPort, containerPort, healthPath, envFile, branch || ''], {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
      cwd: config.SCRIPTS_PATH,
    });
  } catch (err) {
    logger.log(repoName, 'ERROR', deploymentId, `Failed to spawn pipeline: ${err.message}`);
    writeToLog(logFile, `[ERROR] Failed to spawn pipeline: ${err.message}`);
    deploymentService.updateState(deploymentId, 'FAILED_AT_SPAWN', `spawn error: ${err.message}`);
    return;
  }

  fs.mkdirSync(logDir, { recursive: true });
  const stream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  let exited = false;

  child.on('error', (err) => {
    logger.log(repoName, 'ERROR', deploymentId, `Pipeline process error: ${err.message}`);
    writeToLog(logFile, `[ERROR] Pipeline process error: ${err.message}`);
    if (!exited) {
      deploymentService.updateState(deploymentId, 'FAILED_AT_SPAWN', `process error: ${err.message}`);
    }
  });

  child.on('exit', (code, signal) => {
    exited = true;
    if (timeoutId) clearTimeout(timeoutId);

    const reason = signal
      ? `killed by signal ${signal}${signal === 'SIGTERM' ? ' (timeout after ${PIPELINE_TIMEOUT / 1000}s)' : ''}`
      : code !== 0 ? `exited with code ${code}` : '';

    if (code === 0) {
      logger.log(repoName, 'INFO', deploymentId, 'Pipeline completed successfully');
    } else {
      logger.log(repoName, 'WARN', deploymentId, `Pipeline exited: ${reason}`);
      writeToLog(logFile, `[WARN] Pipeline exited: ${reason}`);

      const deployment = deploymentService.read(deploymentId);
      if (deployment && (deployment.state === 'PENDING' || deployment.state === 'STARTED')) {
        deploymentService.updateState(deploymentId, 'FAILED_AT_SPAWN', reason);
      }
    }

    stream.end();
  });

  timeoutId = setTimeout(() => {
    if (!exited) {
      logger.log(repoName, 'WARN', deploymentId, `Pipeline timed out after ${PIPELINE_TIMEOUT / 1000}s — sending SIGTERM`);
      writeToLog(logFile, `[WARN] Pipeline timed out after ${PIPELINE_TIMEOUT / 1000}s — sending SIGTERM`);
      deploymentService.updateState(deploymentId, 'FAILED_AT_SPAWN', `timed out after ${PIPELINE_TIMEOUT / 1000}s`);
      child.kill('SIGTERM');
    }
  }, PIPELINE_TIMEOUT);

  timeoutId.unref();

  child.unref();

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
    });
  } catch (err) {
    logger.log(repoName, 'ERROR', deploymentId, `Failed to spawn rollback: ${err.message}`);
    deploymentService.updateState(deploymentId, 'FAILED');
    return;
  }

  fs.mkdirSync(logDir, { recursive: true });
  const stream = fs.createWriteStream(logFile, { flags: 'a' });
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  let exited = false;

  child.on('error', (err) => {
    logger.log(repoName, 'ERROR', deploymentId, `Rollback process error: ${err.message}`);
    if (!exited) deploymentService.updateState(deploymentId, 'FAILED');
  });

  child.on('exit', (code, signal) => {
    exited = true;
    const reason = signal ? `killed by signal ${signal}` : code !== 0 ? `exited with code ${code}` : '';
    if (code !== 0) {
      logger.log(repoName, 'WARN', deploymentId, `Rollback exited: ${reason}`);
      const dep = deploymentService.read(deploymentId);
      if (dep && dep.state === 'ROLLBACK_STARTED') {
        deploymentService.updateState(deploymentId, 'FAILED', reason);
      }
    }
    stream.end();
  });

  child.unref();

  logger.log(repoName, 'INFO', deploymentId, 'Rollback triggered');
}

module.exports = { trigger, triggerRollback };
