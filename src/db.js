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
  return db;
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

    CREATE TABLE IF NOT EXISTS app_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repo_name TEXT UNIQUE NOT NULL,
      repo_url TEXT,
      health_path TEXT DEFAULT '/health',
      container_port INTEGER,
      host_port INTEGER,
      is_sentinel INTEGER DEFAULT 0,
      registered_at TEXT,
      updated_at TEXT
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
  `);
}

function close() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, close };
