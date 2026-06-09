const crypto = require('crypto');
const config = require('../config');

function authMiddleware(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ message: 'Missing API key' });
  }

  try {
    if (!crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(config.SENTINEL_API_KEY))) {
      return res.status(403).json({ message: 'Invalid API key' });
    }
  } catch {
    return res.status(403).json({ message: 'Invalid API key' });
  }

  next();
}

module.exports = authMiddleware;
