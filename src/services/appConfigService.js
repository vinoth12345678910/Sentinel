const { getDb } = require('../db');
const { createAppConfig } = require('../models/appConfig');

function rowToConfig(row) {
  if (!row) return null;
  return {
    repo_name: row.repo_name,
    repo_url: row.repo_url,
    health_path: row.health_path,
    container_port: row.container_port,
    host_port: row.host_port,
    is_sentinel: Boolean(row.is_sentinel),
    project_id: row.project_id,
    user_id: row.user_id,
    domain: row.domain,
    ssl: Boolean(row.ssl),
    custom_domains: row.custom_domains ? JSON.parse(row.custom_domains) : {},
    previews: row.previews ? JSON.parse(row.previews) : {},
    registered_at: row.registered_at,
    updated_at: row.updated_at,
  };
}

function configToRow(config) {
  return {
    repo_name: config.repo_name,
    repo_url: config.repo_url,
    health_path: config.health_path,
    container_port: config.container_port,
    host_port: config.host_port,
    is_sentinel: config.is_sentinel ? 1 : 0,
    project_id: config.project_id || null,
    user_id: config.user_id || null,
    domain: config.domain || null,
    ssl: config.ssl ? 1 : 0,
    custom_domains: JSON.stringify(config.custom_domains || {}),
    previews: JSON.stringify(config.previews || {}),
  };
}

function getAppConfig(repoName) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM app_configs WHERE repo_name = ?').get(repoName);
  return rowToConfig(row);
}

function createAppConfigRecord(repoName, repoUrl, userId) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM app_configs WHERE repo_name = ?').get(repoName);
  if (existing) {
    return rowToConfig(existing);
  }
  const appConfig = createAppConfig(repoName, repoUrl);
  appConfig.registered_at = new Date().toISOString();
  if (userId !== undefined) {
    appConfig.user_id = userId;
  }
  const row = configToRow(appConfig);
  db.prepare(`
    INSERT INTO app_configs (repo_name, repo_url, health_path, container_port, host_port, is_sentinel, project_id, user_id, domain, ssl, custom_domains, previews, registered_at)
    VALUES (@repo_name, @repo_url, @health_path, @container_port, @host_port, @is_sentinel, @project_id, @user_id, @domain, @ssl, @custom_domains, @previews, @registered_at)
  `).run({
    ...row,
    registered_at: appConfig.registered_at,
  });
  return appConfig;
}

function updateAppConfig(repoName, updates) {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM app_configs WHERE repo_name = ?').get(repoName);
  if (!existing) {
    throw new Error(`App config not found for repo: ${repoName}`);
  }

  const current = rowToConfig(existing);
  const merged = { ...current, ...updates, updated_at: new Date().toISOString() };

  const colMap = {
    repo_name: 'repo_name',
    repo_url: 'repo_url',
    health_path: 'health_path',
    container_port: 'container_port',
    host_port: 'host_port',
    is_sentinel: 'is_sentinel',
    project_id: 'project_id',
    user_id: 'user_id',
    domain: 'domain',
    ssl: 'ssl',
    custom_domains: 'custom_domains',
    previews: 'previews',
    registered_at: 'registered_at',
    updated_at: 'updated_at',
  };

  const setClauses = [];
  const params = { repoName };
  for (const [key, col] of Object.entries(colMap)) {
    if (key in merged) {
      let val = merged[key];
      if (key === 'is_sentinel' || key === 'ssl') {
        val = val ? 1 : 0;
      }
      if ((key === 'custom_domains' || key === 'previews') && typeof val === 'object') {
        val = JSON.stringify(val);
      }
      setClauses.push(`${col} = @${key}`);
      params[key] = val;
    }
  }

  db.prepare(`UPDATE app_configs SET ${setClauses.join(', ')} WHERE repo_name = @repoName`).run(params);
  return getAppConfig(repoName);
}

function getAllAppConfigs(userId) {
  const db = getDb();
  let rows;
  if (userId !== undefined) {
    rows = db.prepare('SELECT * FROM app_configs WHERE user_id = ?').all(userId);
  } else {
    rows = db.prepare('SELECT * FROM app_configs').all();
  }
  return rows.map(rowToConfig).filter(Boolean);
}

function deleteAppConfigFile(repoName) {
  const db = getDb();
  const result = db.prepare('DELETE FROM app_configs WHERE repo_name = ?').run(repoName);
  return result.changes > 0;
}

module.exports = { getAppConfig, createAppConfig: createAppConfigRecord, updateAppConfig, getAllAppConfigs, deleteAppConfigFile };
