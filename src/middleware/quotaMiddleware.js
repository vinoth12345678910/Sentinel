const { getDb } = require('../db');

function ensureQuota(userId) {
  const db = getDb();
  let quota = db.prepare('SELECT * FROM quotas WHERE user_id = ?').get(userId);
  if (!quota) {
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId);
    const maxApps = user && user.role === 'admin' ? 100 : 10;
    const maxDeploymentsPerDay = user && user.role === 'admin' ? 500 : 50;
    db.prepare('INSERT INTO quotas (user_id, max_apps, max_deployments_per_day) VALUES (?, ?, ?)').run(userId, maxApps, maxDeploymentsPerDay);
    quota = db.prepare('SELECT * FROM quotas WHERE user_id = ?').get(userId);
  }
  return quota;
}

function checkAppQuota(req, res, next) {
  if (!req.user) return next();
  const quota = ensureQuota(req.user.id);
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM app_configs WHERE user_id = ?').get(req.user.id)?.count || 0;
  if (count >= quota.max_apps) {
    return res.status(429).json({ message: `App quota exceeded (max ${quota.max_apps} apps)` });
  }
  next();
}

function checkDeploymentQuota(req, res, next) {
  if (!req.user) return next();
  const quota = ensureQuota(req.user.id);
  const db = getDb();
  const today = db.prepare("SELECT COUNT(*) as count FROM deployments WHERE created_at >= datetime('now', 'start of day')").get()?.count || 0;
  if (today >= quota.max_deployments_per_day) {
    return res.status(429).json({ message: `Daily deployment quota exceeded (max ${quota.max_deployments_per_day})` });
  }
  next();
}

module.exports = { ensureQuota, checkAppQuota, checkDeploymentQuota };
