const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getDb } = require('../db');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY_DAYS = 7;

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );
}

function generateRefreshToken(user) {
  const token = jwt.sign(
    { id: user.id, username: user.username, jti: crypto.randomBytes(16).toString('hex') },
    REFRESH_SECRET,
    { expiresIn: `${REFRESH_EXPIRY_DAYS}d` }
  );

  const db = getDb();
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRY_DAYS * 86400000).toISOString();
  db.prepare('INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expiresAt);

  return token;
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch {
    return null;
  }
}

function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const db = getDb();
    const row = db.prepare('SELECT id FROM refresh_tokens WHERE token = ?').get(token);
    if (!row) return null;
    return decoded;
  } catch {
    return null;
  }
}

function revokeRefreshToken(token) {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(token);
}

function revokeAllUserTokens(userId) {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  generateApiKey,
};
