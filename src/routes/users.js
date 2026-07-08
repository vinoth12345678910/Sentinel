const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const { getDb } = require('../db');
const auditLogService = require('../services/auditLogService');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/users', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY username').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch('/users/:id', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { role } = req.body;
    if (role !== undefined) {
      if (!['admin', 'member', 'viewer'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, req.params.id);
    }
    const updated = db.prepare('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?').get(req.params.id);
    auditLogService.log(req.user, 'user.update_role', 'user', updated.id, { role });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/users/me', authMiddleware, apiRateLimiter, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, username, email, role, github_id, github_username, created_at, updated_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
