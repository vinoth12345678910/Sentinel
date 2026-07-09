const path = require('path');
const config = require('./config');

let db = null;

function getDb() {
  if (db) return db;
  const Database = require('better-sqlite3');
  const dbPath = path.join(config.DATA_PATH, 'sentinel.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema();
  runMigrations();
  return db;
}

function runMigrations() {
  const row = db.prepare('SELECT MAX(version) as v FROM _schema_version').get();
  const version = row ? row.v || 0 : 0;

  if (version < 1) {
    const hasProjectUserId = db.prepare("SELECT COUNT(*) as c FROM pragma_table_info('projects') WHERE name = 'user_id'").get().c > 0;
    if (!hasProjectUserId) {
      db.exec("ALTER TABLE projects ADD COLUMN user_id INTEGER REFERENCES users(id)");
    }
    const hasAppConfigUserId = db.prepare("SELECT COUNT(*) as c FROM pragma_table_info('app_configs') WHERE name = 'user_id'").get().c > 0;
    if (!hasAppConfigUserId) {
      db.exec("ALTER TABLE app_configs ADD COLUMN user_id INTEGER REFERENCES users(id)");
    }
    db.prepare('INSERT INTO _schema_version (version) VALUES (1)').run();
  }

  if (version < 2) {
    const hasGithubUsername = db.prepare("SELECT COUNT(*) as c FROM pragma_table_info('users') WHERE name = 'github_username'").get().c > 0;
    if (!hasGithubUsername) {
      db.exec("ALTER TABLE users ADD COLUMN github_username TEXT");
    }
    db.prepare('INSERT INTO _schema_version (version) VALUES (2)').run();
  }

  if (version < 3) {
    const cols = ['domain', 'ssl', 'custom_domains', 'previews', 'user_id'];
    for (const col of cols) {
      const exists = db.prepare(`SELECT COUNT(*) as c FROM pragma_table_info('app_configs') WHERE name = '${col}'`).get().c > 0;
      if (!exists) {
        switch (col) {
          case 'domain': db.exec("ALTER TABLE app_configs ADD COLUMN domain TEXT"); break;
          case 'ssl': db.exec("ALTER TABLE app_configs ADD COLUMN ssl INTEGER DEFAULT 0"); break;
          case 'custom_domains': db.exec("ALTER TABLE app_configs ADD COLUMN custom_domains TEXT DEFAULT '{}'"); break;
          case 'previews': db.exec("ALTER TABLE app_configs ADD COLUMN previews TEXT DEFAULT '{}'"); break;
          case 'user_id': db.exec("ALTER TABLE app_configs ADD COLUMN user_id INTEGER REFERENCES users(id)"); break;
        }
      }
    }
    db.prepare('INSERT INTO _schema_version (version) VALUES (3)').run();
  }
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_version (
      version INTEGER PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      api_key TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      github_id TEXT,
      github_token_encrypted TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS app_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT UNIQUE NOT NULL,
      repo_url TEXT,
      health_path TEXT DEFAULT '/health',
      container_port INTEGER,
      host_port INTEGER,
      is_sentinel INTEGER DEFAULT 0,
      project_id INTEGER,
      user_id INTEGER REFERENCES users(id),
      domain TEXT,
      ssl INTEGER DEFAULT 0,
      custom_domains TEXT DEFAULT '{}',
      previews TEXT DEFAULT '{}',
      registered_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS app_env_vars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT NOT NULL,
      key TEXT NOT NULL,
      value_encrypted TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(repo_name, key)
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deployment_id TEXT UNIQUE NOT NULL,
      repo_name TEXT NOT NULL,
      branch TEXT,
      commit_hash TEXT,
      pusher TEXT,
      state TEXT NOT NULL DEFAULT 'PENDING',
      failure_reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deployment_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deployment_id TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'INFO',
      message TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_deployments_repo ON deployments(repo_name);
    CREATE INDEX IF NOT EXISTS idx_deployments_state ON deployments(state);
    CREATE INDEX IF NOT EXISTS idx_deployment_logs_deploy ON deployment_logs(deployment_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_app_configs_project ON app_configs(project_id);
    CREATE INDEX IF NOT EXISTS idx_app_env_vars_app ON app_env_vars(repo_name);

    CREATE TABLE IF NOT EXISTS custom_domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT NOT NULL,
      domain TEXT NOT NULL,
      ssl_enabled INTEGER NOT NULL DEFAULT 1,
      ssl_provisioned_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(domain)
    );

    CREATE INDEX IF NOT EXISTS idx_custom_domains_repo ON custom_domains(repo_name);

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS team_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      project_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(team_id, project_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      max_apps INTEGER NOT NULL DEFAULT 10,
      max_deployments_per_day INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
    CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
  `);
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, close };
