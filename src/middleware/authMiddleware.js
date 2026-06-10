const crypto = require('crypto');
const config = require('../config');
const authService = require('../services/authService');
const { getDb } = require('../db');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const decoded = authService.verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    return next();
  }

  if (apiKey) {
    // Constant-time comparison: always compare same-length buffers
    const keyBuf = Buffer.from(apiKey);
    const adminKeyBuf = Buffer.from(config.SENTINEL_API_KEY);

    if (keyBuf.length === adminKeyBuf.length && crypto.timingSafeEqual(keyBuf, adminKeyBuf)) {
      req.user = { id: 0, username: 'admin', role: 'owner' };
      return next();
    }

    const db = getDb();
    const user = db.prepare('SELECT id, username, role FROM users WHERE api_key = ?').get(apiKey);
    if (user) {
      req.user = user;
      return next();
    }
  }

  return res.status(401).json({ message: 'Authentication required' });
}

module.exports = authMiddleware;
