const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');
const { getDb } = require('../db');
const { encrypt, decrypt } = require('../services/encryption');
const appConfigService = require('../services/appConfigService');
const logger = require('../services/loggerService');
const config = require('../config');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

function requireAppOwnership(repoName, userId) {
  if (userId === 0) return { id: -1 }; // admin API key — bypass ownership check
  const db = getDb();
  return db.prepare('SELECT id FROM app_configs WHERE repo_name = ? AND user_id = ?').get(repoName, userId);
}

router.post('/apps/:repoName/env', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    if (!validateRepoName(repoName)) return res.status(400).json({ message: 'Invalid repo name' });
    if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

    const { key, value } = req.body;
    if (!key || value === undefined) return res.status(400).json({ message: 'key and value are required' });
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return res.status(400).json({ message: 'Invalid env var name' });
    }

    const db = getDb();
    const encrypted = encrypt(String(value));
    db.prepare(`
      INSERT INTO app_env_vars (repo_name, key, value_encrypted) VALUES (?, ?, ?)
      ON CONFLICT(repo_name, key) DO UPDATE SET value_encrypted = ?, updated_at = datetime('now')
    `).run(repoName, key, encrypted, encrypted);

    logger.log(repoName, 'INFO', '-', `Env var ${key} set`);
    res.json({ message: 'Env var set', key });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/apps/:repoName/env', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    if (!validateRepoName(repoName)) return res.status(400).json({ message: 'Invalid repo name' });
    if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

    const db = getDb();
    const rows = db.prepare('SELECT key, value_encrypted, created_at, updated_at FROM app_env_vars WHERE repo_name = ?').all(repoName);

    const vars = rows.map(r => ({
      key: r.key,
      value: '••••••••',
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    res.json(vars);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/apps/:repoName/env/:key', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName, key } = req.params;
    if (!validateRepoName(repoName)) return res.status(400).json({ message: 'Invalid repo name' });
    if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

    const db = getDb();
    db.prepare('DELETE FROM app_env_vars WHERE repo_name = ? AND key = ?').run(repoName, key);
    logger.log(repoName, 'INFO', '-', `Env var ${key} deleted`);
    res.json({ message: 'Env var deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function writeEnvFile(repoName) {
  const db = getDb();
  const rows = db.prepare('SELECT key, value_encrypted FROM app_env_vars WHERE repo_name = ?').all(repoName);
  if (rows.length === 0) return null;

  const envDir = path.join(config.REPOS_BASE_PATH, repoName);
  fs.mkdirSync(envDir, { recursive: true });
  const envFile = path.join(envDir, '.env.deployment');

  const lines = rows.map(r => {
    try {
      const value = decrypt(r.value_encrypted);
      return `${r.key}=${value}`;
    } catch {
      return `# ${r.key}=<decryption error>`;
    }
  });

  fs.writeFileSync(envFile, lines.join('\n') + '\n');
  return envFile;
}

router.get('/apps/:repoName/env/export', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });
    const envFile = writeEnvFile(repoName);
    if (!envFile) return res.json({ message: 'No env vars', env_file: null });
    res.json({ message: 'Env file written', env_file: envFile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/apps/:repoName', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    if (!validateRepoName(repoName)) return res.status(400).json({ message: 'Invalid repo name' });
    if (!requireAppOwnership(repoName, req.user.id)) return res.status(404).json({ message: 'App not found' });

    const db = getDb();
    db.prepare('DELETE FROM app_env_vars WHERE repo_name = ?').run(repoName);
    db.prepare('DELETE FROM deployments WHERE repo_name = ?').run(repoName);
    appConfigService.deleteAppConfigFile(repoName);

    const repoDir = path.join(config.REPOS_BASE_PATH, repoName);
    if (fs.existsSync(repoDir)) {
      fs.rmSync(repoDir, { recursive: true, force: true });
    }

    const child = require('child_process');
    try {
      child.execSync(`docker rm -f ${repoName} 2>/dev/null || true`);
      child.execSync(`docker rmi $(docker images --format '{{.Repository}}:{{.Tag}}' | grep -i "^${repoName}:") 2>/dev/null || true`);
    } catch { /* ignore docker cleanup errors */ }

    try {
      const nginxConfig = `/etc/nginx/sites-available/sentinel-${repoName}.conf`;
      const nginxEnabled = `/etc/nginx/sites-enabled/sentinel-${repoName}.conf`;
      if (fs.existsSync(nginxConfig)) fs.unlinkSync(nginxConfig);
      if (fs.existsSync(nginxEnabled)) fs.unlinkSync(nginxEnabled);
      child.execSync('nginx -s reload 2>/dev/null || true');
    } catch { /* ignore nginx cleanup errors */ }

    logger.log(repoName, 'INFO', '-', 'App deleted');
    res.json({ message: 'App deleted', repo_name: repoName });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, writeEnvFile };
