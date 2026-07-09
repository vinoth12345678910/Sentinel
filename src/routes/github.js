const express = require('express');
const crypto = require('crypto');
const authMiddleware = require('../middleware/authMiddleware');
const authService = require('../services/authService');
const githubService = require('../services/githubService');
const appConfigService = require('../services/appConfigService');
const deploymentService = require('../services/deploymentService');
const pipelineService = require('../services/pipelineService');
const logger = require('../services/loggerService');
const config = require('../config');
const { apiRateLimiter } = require('../middleware/rateLimiter');
const { validateRepoName } = require('../middleware/validateInput');
const { createDeployment } = require('../models/deployment');

const router = express.Router();

function findFreePort(repoName, excludePort) {
  const allConfigs = appConfigService.getAllAppConfigs();
  const usedPorts = allConfigs
    .flatMap(c => {
      const ports = [];
      if (c.repo_name !== repoName && c.host_port) ports.push(c.host_port);
      if (c.previews) {
        Object.values(c.previews).forEach(p => {
          if (p.host_port) ports.push(p.host_port);
        });
      }
      return ports;
    });
  let port = excludePort || 3000;
  while (usedPorts.includes(port)) {
    port++;
  }
  return port;
}

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
    return res.redirect('/dashboard/settings?github_error=missing_code');
  }

  try {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (!refreshToken) {
      return res.redirect('/dashboard/settings?github_error=not_authenticated');
    }

    const decoded = authService.verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      return res.redirect('/dashboard/settings?github_error=session_expired');
    }

    const ghToken = await githubService.exchangeCodeForToken(code);
    const githubUser = await githubService.getAuthenticatedUser(ghToken);

    githubService.storeUserToken(decoded.id, githubUser.id.toString(), ghToken, githubUser.login);

    logger.log('github', 'INFO', '-', `GitHub connected for user ${decoded.id} (${githubUser.login})`);

    res.redirect('/dashboard/settings?github=connected');
  } catch (err) {
    logger.log('github', 'ERROR', '-', `GitHub OAuth callback failed: ${err.message}`);
    res.redirect('/dashboard/settings?github_error=callback_failed');
  }
});

router.get('/github/repos', authMiddleware, apiRateLimiter, async (req, res) => {
  try {
    const token = githubService.getUserToken(req.user.id);
    if (!token) {
      return res.status(401).json({ message: 'GitHub not connected. Visit /auth/github to connect.' });
    }

    const repos = await githubService.listUserRepos(token);
    const appConfigs = appConfigService.getAllAppConfigs(req.user.id);
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
    const { repo_name, repo_url, build_command, start_command, container_port, health_path, env, project_id } = req.body;

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

    const overrides = {};
    if (build_command !== undefined) overrides.build_command = build_command;
    if (start_command !== undefined) overrides.start_command = start_command;
    if (container_port !== undefined) overrides.container_port = container_port;
    if (health_path !== undefined) overrides.health_path = health_path;
    if (env !== undefined) overrides.env = env;

    appConfigService.createAppConfig(repo_name, repo_url, req.user.id);
    if (Object.keys(overrides).length > 0) {
      appConfigService.updateAppConfig(repo_name, overrides);
    }

    if (project_id) {
      const db = require('../db').getDb();
      const proj = db.prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?').get(project_id, req.user.id);
      if (proj) {
        db.prepare('UPDATE app_configs SET project_id = ? WHERE repo_name = ?').run(project_id, repo_name);
      }
    }

    logger.log(repo_name, 'INFO', '-', 'App imported from GitHub');

    const appConfig = appConfigService.getAppConfig(repo_name);

    try {
      let defaultBranch = 'main';
      let actualRepoUrl = repo_url;
      if (token) {
        const repoData = await githubService.listUserRepos(token).catch(() => []);
        const match = repoData.find(r => r.name === repo_name);
        if (match) {
          actualRepoUrl = match.clone_url;
          defaultBranch = match.default_branch || 'main';
        }
      }

      const timestamp = Date.now().toString();
      const deployment = createDeployment({
        repo_name,
        branch: defaultBranch,
        commit_hash: 'initial-import',
        pusher: req.user.username || 'api',
        timestamp,
      });
      deploymentService.create(deployment);

      const containerPortFinal = appConfig.container_port || 3000;
      const healthPathFinal = appConfig.health_path || '/health';
      const hostPort = appConfig.host_port || findFreePort(repo_name, 3000);
      if (!appConfig.host_port) {
        appConfigService.updateAppConfig(repo_name, { host_port: hostPort });
      }

      pipelineService.trigger(repo_name, deployment.deployment_id, actualRepoUrl, 'initial-import', hostPort, containerPortFinal, healthPathFinal, defaultBranch);
      appConfig.deployment_id = deployment.deployment_id;
    } catch (deployErr) {
      logger.log(repo_name, 'WARN', '-', `Auto-deploy failed: ${deployErr.message}`);
    }

    res.status(201).json({ message: 'App imported', app: appConfig });
  } catch (err) {
    res.status(500).json({ message: `Import failed: ${err.message}` });
  }
});

router.post('/auth/github/disconnect', authMiddleware, apiRateLimiter, (req, res) => {
  try {
    githubService.clearUserToken(req.user.id);
    logger.log('github', 'INFO', '-', `GitHub disconnected for user ${req.user.id}`);
    res.json({ message: 'GitHub disconnected' });
  } catch (err) {
    res.status(500).json({ message: `Failed to disconnect: ${err.message}` });
  }
});

module.exports = router;
