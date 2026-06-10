#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

process.env.SCRIPTS_PATH = process.env.SCRIPTS_PATH || path.join(__dirname);
process.env.DATA_PATH = process.env.DATA_PATH || path.join(__dirname, '..', 'data');
process.env.REPOS_BASE_PATH = process.env.REPOS_BASE_PATH || path.join(__dirname, '..', 'repos');
process.env.SENTINEL_API_KEY = process.env.SENTINEL_API_KEY || 'migration-script-key';
process.env.GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || 'migration-script-secret';

const { getDb } = require('../src/db');
const db = getDb();

console.log('Migrating app configs from JSON files...');
const appsDir = path.join(process.env.DATA_PATH, 'apps');
if (fs.existsSync(appsDir)) {
  const files = fs.readdirSync(appsDir).filter(f => f.endsWith('.json'));
  let count = 0;
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(appsDir, file), 'utf-8'));
      db.prepare(`
        INSERT OR REPLACE INTO app_configs (repo_name, repo_url, health_path, container_port, host_port, is_sentinel, registered_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.repo_name,
        data.repo_url || null,
        data.health_path || '/health',
        data.container_port || null,
        data.host_port || null,
        data.is_sentinel ? 1 : 0,
        data.registered_at || null,
        data.updated_at || null
      );
      count++;
    } catch (e) {
      console.error(`  Error migrating ${file}: ${e.message}`);
    }
  }
  console.log(`  Migrated ${count} app configs`);
}

console.log('Migrating deployments from JSON files...');
const reposDir = process.env.REPOS_BASE_PATH;
let deployCount = 0;
if (fs.existsSync(reposDir)) {
  const repos = fs.readdirSync(reposDir);
  for (const repo of repos) {
    const deployDir = path.join(reposDir, repo, 'deployments');
    if (!fs.existsSync(deployDir)) continue;
    const files = fs.readdirSync(deployDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(deployDir, file), 'utf-8'));
        db.prepare(`
          INSERT OR REPLACE INTO deployments (deployment_id, repo_name, branch, commit_hash, pusher, state, failure_reason, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          data.deployment_id,
          data.repo_name,
          data.branch || null,
          data.commit_hash || null,
          data.pusher || null,
          data.state || 'PENDING',
          data.failure_reason || null,
          data.created_at || new Date().toISOString(),
          data.updated_at || new Date().toISOString()
        );
        deployCount++;
      } catch (e) {
        console.error(`  Error migrating deployment ${file}: ${e.message}`);
      }
    }
  }
}
console.log(`  Migrated ${deployCount} deployments`);

console.log('Migration complete!');
db.close();
