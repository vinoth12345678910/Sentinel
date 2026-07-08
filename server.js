const app = require('./src/app');
const config = require('./src/config');
const bcrypt = require('bcrypt');
const { getDb } = require('./src/db');
const authService = require('./src/services/authService');

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedAdmin() {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.log('ADMIN_USERNAME/ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }
  if (ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters');
    return;
  }
  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(ADMIN_USERNAME);
    if (existing) {
      console.log(`Admin user "${ADMIN_USERNAME}" already exists`);
      return;
    }
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const apiKey = authService.generateApiKey();
    db.prepare(
      'INSERT INTO users (username, email, password_hash, api_key, role) VALUES (?, ?, ?, ?, ?)'
    ).run(ADMIN_USERNAME, `${ADMIN_USERNAME}@admin.local`, hash, apiKey, 'admin');
    console.log(`Admin user "${ADMIN_USERNAME}" created with role=admin`);
  } catch (err) {
    console.error('Admin seed failed:', err.message);
  }
}

process.on('uncaughtException', (err) => {
  console.error(`FATAL: Uncaught exception - ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`ERROR: Unhandled rejection - ${reason.message || reason}`);
  if (reason.stack) console.error(reason.stack);
});

let server;

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function cleanupStaleDeployments() {
  try {
    const deploymentService = require('./src/services/deploymentService');
    const PIPELINE_TIMEOUT_MS = 600000;
    const now = Date.now();
    const all = deploymentService.listAll();
    let cleaned = 0;
    for (const dep of all) {
      if (dep.state === 'PENDING' || dep.state === 'STARTED') {
        const age = now - new Date(dep.created_at).getTime();
        if (age > PIPELINE_TIMEOUT_MS) {
          deploymentService.updateState(dep.deployment_id, 'FAILED_AT_SPAWN', 'timed out (no pipeline activity)');
          cleaned++;
        }
      }
    }
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} stale deployment(s)`);
    }
  } catch (err) {
    console.error('Stale deployment cleanup failed:', err.message);
  }
}

seedAdmin().then(() => {
  cleanupStaleDeployments();
  setInterval(cleanupStaleDeployments, 300000);

  server = app.listen(config.PORT, (err) => {
    if (err) {
      console.error(`FATAL: Failed to start server on port ${config.PORT} - ${err.message}`);
      process.exit(1);
    }
    console.log(`Sentinel backend running on port ${config.PORT}`);
  });
});
