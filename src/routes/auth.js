const express = require('express');
const bcrypt = require('bcrypt');
const { getDb } = require('../db');
const authService = require('../services/authService');
const auditLogService = require('../services/auditLogService');
const { apiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/auth/register', apiRateLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email, and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const apiKey = authService.generateApiKey();
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, api_key, role) VALUES (?, ?, ?, ?, ?)'
    ).run(username, email, passwordHash, apiKey, 'member');

    const user = { id: result.lastInsertRowid, username, role: 'member' };
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    auditLogService.log(user, 'auth.register', 'user', user.id, { username });

    res.status(201).json({
      accessToken,
      apiKey,
      user: { id: user.id, username, email, role: 'member' },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

router.post('/auth/login', apiRateLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(username, username);
    if (!row) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = { id: row.id, username: row.username, role: row.role };
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    auditLogService.log(user, 'auth.login', 'user', user.id, { username });

    res.json({
      accessToken,
      apiKey: row.api_key,
      user: { id: row.id, username: row.username, email: row.email, role: row.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.post('/auth/refresh', apiRateLimiter, (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const decoded = authService.verifyRefreshToken(token);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const db = getDb();
    const row = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(decoded.id);
    if (!row) {
      return res.status(401).json({ message: 'User not found' });
    }

    authService.revokeRefreshToken(token);
    const user = { id: row.id, username: row.username, role: row.role };
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ message: 'Token refresh failed' });
  }
});

router.post('/auth/logout', apiRateLimiter, (req, res) => {
  try {
    const token = req.cookies && req.cookies.refreshToken;
    if (token) {
      authService.revokeRefreshToken(token);
    }

    res.clearCookie('refreshToken', { path: '/auth' });
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Logout failed' });
  }
});

module.exports = router;
