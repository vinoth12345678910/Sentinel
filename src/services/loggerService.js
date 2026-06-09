const fs = require('fs');
const path = require('path');
const config = require('../config');

const MAX_LOG_SIZE = 5 * 1024 * 1024;

function ensureLogDir(repoName) {
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  return logDir;
}

function rotateIfNeeded(logFile) {
  try {
    const stat = fs.statSync(logFile);
    if (stat.size > MAX_LOG_SIZE) {
      const rotated = logFile + '.1';
      if (fs.existsSync(rotated)) {
        fs.unlinkSync(rotated);
      }
      fs.renameSync(logFile, rotated);
    }
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.error(`Log rotation error: ${e.message}`);
    }
  }
}

function log(repoName, level, deploymentId, message) {
  try {
    const logDir = ensureLogDir(repoName);
    const logFile = path.join(logDir, 'sentinel.log');
    rotateIfNeeded(logFile);
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] [${level}] [${deploymentId}] ${message}\n`;
    fs.appendFileSync(logFile, line);
  } catch (e) {
    console.error(`Log write error: ${e.message}`);
  }
}

module.exports = { log };
