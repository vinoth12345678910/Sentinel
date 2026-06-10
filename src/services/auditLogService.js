const { getDb } = require('../db');

function log(user, action, resourceType, resourceId, details) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO audit_log (user_id, username, action, resource_type, resource_id, details, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      user ? user.id : null,
      user ? user.username : 'system',
      action,
      resourceType || null,
      resourceId ? String(resourceId) : null,
      details ? JSON.stringify(details) : null,
      null
    );
  } catch {}
}

function list(options) {
  const db = getDb();
  const { limit, offset, userId, action, resourceType } = options || {};
  let sql = 'SELECT * FROM audit_log WHERE 1=1';
  const params = [];

  if (userId) { sql += ' AND user_id = ?'; params.push(userId); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  if (resourceType) { sql += ' AND resource_type = ?'; params.push(resourceType); }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit || 100, offset || 0);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({
    ...r,
    details: r.details ? JSON.parse(r.details) : null,
  }));
}

function getStats() {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get()?.count || 0;
  const last24h = db.prepare("SELECT COUNT(*) as count FROM audit_log WHERE created_at >= datetime('now', '-1 day')").get()?.count || 0;
  const actions = db.prepare('SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC LIMIT 10').all();
  return { total, last24h, actions };
}

module.exports = { log, list, getStats };
