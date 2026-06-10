const express = require('express');
const path = require('path');
const { execSync } = require('child_process');
const authMiddleware = require('../middleware/authMiddleware');
const { getDb } = require('../db');
const appConfigService = require('../services/appConfigService');
const logger = require('../services/loggerService');
const config = require('../config');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

router.get('/apps/:repoName/domains', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    const db = getDb();
    const domains = db.prepare('SELECT * FROM custom_domains WHERE repo_name = ? ORDER BY domain').all(repoName);
    res.json(domains);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/apps/:repoName/domains', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName } = req.params;
    if (!validateRepoName(repoName)) return res.status(400).json({ message: 'Invalid repo name' });
    const app = appConfigService.getAppConfig(repoName);
    if (!app) return res.status(404).json({ message: 'App not found' });

    const { domain, ssl_enabled } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ message: 'Domain is required' });
    }

    const domainRegex = /^(?:\*\.)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return res.status(400).json({ message: 'Invalid domain format' });
    }

    const db = getDb();
    db.prepare('INSERT OR IGNORE INTO custom_domains (repo_name, domain, ssl_enabled) VALUES (?, ?, ?)').run(repoName, domain, ssl_enabled !== undefined ? (ssl_enabled ? 1 : 0) : 1);

    const row = db.prepare('SELECT * FROM custom_domains WHERE domain = ?').get(domain);
    if (!row) return res.status(409).json({ message: 'Domain already assigned to another app' });

    autoNginxConfig(repoName, app, db);
    provisionSSL(repoName, domain);

    logger.log(repoName, 'INFO', '-', `Domain ${domain} added`);
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/apps/:repoName/domains/:id', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    const { repoName, id } = req.params;
    const db = getDb();
    const domain = db.prepare('SELECT * FROM custom_domains WHERE id = ? AND repo_name = ?').get(id, repoName);
    if (!domain) return res.status(404).json({ message: 'Domain not found' });

    db.prepare('DELETE FROM custom_domains WHERE id = ?').run(id);
    autoNginxConfig(repoName, appConfigService.getAppConfig(repoName), db);

    logger.log(repoName, 'INFO', '-', `Domain ${domain.domain} removed`);
    res.json({ message: 'Domain removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

function autoNginxConfig(repoName, app, db) {
  const hostPort = app ? app.host_port : 3000;
  const domains = db.prepare('SELECT domain, ssl_enabled FROM custom_domains WHERE repo_name = ?').all(repoName);
  try {
    const script = path.join(config.SCRIPTS_PATH, 'nginx-config.sh');
    const domainArgs = domains.map(d => `${d.domain}:${d.ssl_enabled ? 1 : 0}`).join(',');
    execSync(`bash "${script}" "${repoName}" "${hostPort}" "${domainArgs}" 2>/dev/null || true`);
  } catch {}
}

function provisionSSL(repoName, domain) {
  try {
    const result = execSync(`certbot --nginx -d "${domain}" --non-interactive --agree-tos --email admin@${domain} 2>&1 || true`);
    const output = result.toString();
    if (output.includes('success') || output.includes('Certificate') || output.includes('Congratulations')) {
      const db = getDb();
      db.prepare('UPDATE custom_domains SET ssl_provisioned_at = datetime(\'now\') WHERE domain = ?').run(domain);
    }
  } catch {}
}

module.exports = router;
