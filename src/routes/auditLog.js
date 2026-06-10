const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const auditLogService = require('../services/auditLogService');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/audit-log', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const { limit, offset, user_id, action, resource_type } = req.query;
    const entries = auditLogService.list({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      userId: user_id || null,
      action: action || null,
      resourceType: resource_type || null,
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/audit-log/stats', authMiddleware, requireRole('admin'), apiRateLimiter, (req, res) => {
  try {
    const stats = auditLogService.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
