const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const githubService = require('../services/githubService');
const appConfigService = require('../services/appConfigService');
const logger = require('../services/loggerService');
const config = require('../config');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');

const router = express.Router();

router.get('/auth/github', (req, res) => {
  if (!githubService.isConfigured()) {
    return res.status(501).json({ message: 'GitHub OAuth not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET.' });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const url = githubService.getAuthorizationUrl(state);
  res.redirect(url);
});

router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.status(400).json({ message: 'Missing authorization code' });
  }

  try {
    const token = await githubService.exchangeCodeForToken(code);
    const githubUser = await githubService.getAuthenticatedUser(token);

    githubService.storeUserToken(req.user ? req.user.id : 1, githubUser.id.toString(), token);

    res.redirect('/dashboard/#/settings');
  } catch (err) {
    logger.log('github', 'ERROR', '-', `GitHub OAuth callback failed: ${err.message}`);
    res.status(500).json({ message: `GitHub OAuth failed: ${err.message}` });
  }
});

router.get('/github/repos', authMiddleware, apiRateLimiter, async (req, res) => {
  try {
    const token = githubService.getUserToken(req.user.id);
    if (!token) {
      return res.status(401).json({ message: 'GitHub not connected. Visit /auth/github to connect.' });
    }

    const repos = await githubService.listUserRepos(token);
    const appConfigs = appConfigService.getAllAppConfigs();
    const registeredRepos = new Set(appConfigs.map(a => a.repo_name.toLowerCase()));

    const result = repos
      .filter(r => !r.fork && !r.archived)
      .map(r => ({
        name: r.name,
        full_name: r.full_name,
        url: r.clone_url,
        language: r.language,
        description: r.description,
        private: r.private,
        registered: registeredRepos.has(r.name.toLowerCase()),
      }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: `Failed to list repos: ${err.message}` });
  }
});

router.post('/apps/import', authMiddleware, apiRateLimiter, async (req, res) => {
  try {
    const { repo_name, repo_url } = req.body;

    if (!repo_name || !repo_url) {
      return res.status(400).json({ message: 'repo_name and repo_url are required' });
    }

    if (!validateRepoName(repo_name)) {
      return res.status(400).json({ message: 'Invalid repository name' });
    }

    const existing = appConfigService.getAppConfig(repo_name);
    if (existing) {
      return res.status(409).json({ message: 'App already registered' });
    }

    const webhookUrl = `${config.BACKEND_URL}/webhook`;
    const secret = config.GITHUB_WEBHOOK_SECRET;

    const token = githubService.getUserToken(req.user.id);
    if (token) {
      try {
        const fullName = repo_url.replace('https://github.com/', '').replace('.git', '');
        await githubService.registerWebhook(token, fullName, webhookUrl, secret);
        logger.log(repo_name, 'INFO', '-', 'Webhook auto-registered on GitHub');
      } catch (webhookErr) {
        logger.log(repo_name, 'WARN', '-', `Webhook registration failed: ${webhookErr.message}`);
      }
    }

    const { project_id } = req.body;
    appConfigService.createAppConfig(repo_name, repo_url);

    const db = require('../db').getDb();
    if (project_id) {
      const proj = db.prepare('SELECT id FROM projects WHERE id = ?').get(project_id);
      if (proj) {
        db.prepare('UPDATE app_configs SET project_id = ? WHERE repo_name = ?').run(project_id, repo_name);
      }
    }

    logger.log(repo_name, 'INFO', '-', 'App imported from GitHub');
    const appConfig = appConfigService.getAppConfig(repo_name);
    const row = db.prepare('SELECT project_id FROM app_configs WHERE repo_name = ?').get(repo_name);
    appConfig.project_id = row ? row.project_id : null;
    res.status(201).json({ message: 'App imported', app: appConfig });
  } catch (err) {
    res.status(500).json({ message: `Import failed: ${err.message}` });
  }
});

module.exports = router;
