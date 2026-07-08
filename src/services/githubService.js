const { encrypt, decrypt } = require('./encryption');
const { getDb } = require('../db');

const GITHUB_API = 'https://api.github.com';

function getClientId() {
  return process.env.GITHUB_OAUTH_CLIENT_ID;
}

function getClientSecret() {
  return process.env.GITHUB_OAUTH_CLIENT_SECRET;
}

function getRedirectUri() {
  return process.env.GITHUB_OAUTH_REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3000'}/auth/github/callback`;
}

function isConfigured() {
  return !!(getClientId() && getClientSecret());
}

function getAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    scope: 'repo,admin:repo_hook',
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: getClientId(),
      client_secret: getClientSecret(),
      code,
      redirect_uri: getRedirectUri(),
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function getAuthenticatedUser(token) {
  const res = await fetch(`${GITHUB_API}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Sentinel',
    },
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function listUserRepos(token) {
  const res = await fetch(`${GITHUB_API}/user/repos?per_page=100&sort=updated&type=owner`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Sentinel',
    },
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function registerWebhook(token, repoFullName, webhookUrl, secret) {
  const res = await fetch(`${GITHUB_API}/repos/${repoFullName}/hooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Sentinel',
    },
    body: JSON.stringify({
      name: 'web',
      active: true,
      events: ['push'],
      config: {
        url: webhookUrl,
        content_type: 'json',
        secret,
        insecure_ssl: '0',
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to register webhook: ${err.message || res.status}`);
  }

  return res.json();
}

function storeUserToken(userId, githubId, token, githubUsername) {
  const db = getDb();
  const encrypted = encrypt(token);

  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!existing) throw new Error('User not found');

  db.prepare('UPDATE users SET github_id = ?, github_token_encrypted = ?, github_username = ? WHERE id = ?')
    .run(githubId, encrypted, githubUsername || null, userId);
}

function getUserToken(userId) {
  const db = getDb();
  const row = db.prepare('SELECT github_token_encrypted FROM users WHERE id = ?').get(userId);
  if (!row || !row.github_token_encrypted) return null;
  try {
    return decrypt(row.github_token_encrypted);
  } catch {
    return null;
  }
}

function getUserGitHubInfo(userId) {
  const db = getDb();
  return db.prepare('SELECT github_id, github_username FROM users WHERE id = ?').get(userId) || null;
}

function clearUserToken(userId) {
  const db = getDb();
  db.prepare('UPDATE users SET github_id = NULL, github_token_encrypted = NULL, github_username = NULL WHERE id = ?').run(userId);
}

module.exports = {
  isConfigured,
  getAuthorizationUrl,
  exchangeCodeForToken,
  getAuthenticatedUser,
  listUserRepos,
  registerWebhook,
  storeUserToken,
  getUserToken,
  getUserGitHubInfo,
  clearUserToken,
};
