const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { verifyAccessToken } = require('../services/authService');

const router = express.Router();

function authSSE(req, res, next) {
  const token = req.query.token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  const decoded = verifyAccessToken(token);
  if (!decoded) return res.status(401).json({ message: 'Invalid or expired token' });
  req.user = decoded;
  next();
}

const clients = new Map();

function getLogPaths(repoName) {
  const logDir = path.join(config.REPOS_BASE_PATH, repoName, 'logs');
  return [
    path.join(logDir, 'sentinel.log'),
    path.join(logDir, 'pipeline.log'),
    path.join(logDir, 'rollback.log'),
  ];
}

function findRepoForDeployment(deploymentId) {
  const reposDir = config.REPOS_BASE_PATH;
  if (fs.existsSync(reposDir)) {
    const repos = fs.readdirSync(reposDir);
    for (const repo of repos) {
      const deployPath = path.join(reposDir, repo, 'deployments', `${deploymentId}.json`);
      if (fs.existsSync(deployPath)) {
        try {
          const deployment = JSON.parse(fs.readFileSync(deployPath, 'utf-8'));
          return deployment.repo_name;
        } catch { return null; }
      }
    }
  }
  try {
    const db = require('../db').getDb();
    const row = db.prepare('SELECT repo_name FROM deployments WHERE deployment_id = ?').get(deploymentId);
    return row ? row.repo_name : null;
  } catch { return null; }
}

function getNewLines(filePath, fromPos) {
  if (!fs.existsSync(filePath)) return { lines: [], newPos: fromPos };
  const stat = fs.statSync(filePath);
  if (stat.size <= fromPos) return { lines: [], newPos: fromPos };
  const fd = fs.openSync(filePath, 'r');
  const len = stat.size - fromPos;
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, fromPos);
  fs.closeSync(fd);
  const text = buf.toString('utf-8');
  const parts = text.split('\n');
  const lines = parts.slice(0, -1);
  const remainder = parts[parts.length - 1];
  const newPos = stat.size - Buffer.byteLength(remainder, 'utf-8');
  return { lines, newPos };
}

router.get('/deployments/:id/logs/stream', authSSE, (req, res) => {
  const { id } = req.params;
  const repoName = findRepoForDeployment(id);
  if (!repoName) {
    return res.status(404).json({ message: 'Deployment not found' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write(`data: ${JSON.stringify({ type: 'connected', deployment_id: id })}\n\n`);

  const clientId = `${id}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const paths = getLogPaths(repoName);
  const positions = {};

  for (const p of paths) {
    positions[p] = fs.existsSync(p) ? fs.statSync(p).size : 0;
  }

  clients.set(clientId, { res, id, positions });

  function checkFiles() {
    const client = clients.get(clientId);
    if (!client) return;
    for (const filePath of paths) {
      const { lines, newPos } = getNewLines(filePath, client.positions[filePath] || 0);
      client.positions[filePath] = newPos;
      for (const line of lines) {
        if (line.includes(id)) {
          client.res.write(`data: ${JSON.stringify({ line })}\n\n`);
        }
      }
    }
  }

  const watchers = paths.map(filePath => {
    if (!fs.existsSync(filePath)) return null;
    try {
      return fs.watch(filePath, () => checkFiles());
    } catch { return null; }
  }).filter(Boolean);

  checkFiles();

  const pollInterval = setInterval(checkFiles, 2000);

  req.on('close', () => {
    clients.delete(clientId);
    watchers.forEach(w => { try { w.close(); } catch {} });
    clearInterval(pollInterval);
    res.end();
  });
});

module.exports = router;
