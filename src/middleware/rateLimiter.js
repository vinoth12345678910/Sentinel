const rateLimit = require('express-rate-limit');

function logRateLimit(req, res, next) {
  const msg = 'Too many requests';
  console.warn(`[RATE_LIMIT] ${req.method} ${req.originalUrl} from ${req.ip}`);
  res.status(429).json({ message: msg });
}

const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: logRateLimit,
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: logRateLimit,
});

module.exports = { webhookRateLimiter, apiRateLimiter };
