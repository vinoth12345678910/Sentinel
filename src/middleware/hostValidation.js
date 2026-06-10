const config = require('../config');

function hostValidation(req, res, next) {
  const host = req.headers['host'];
  if (!host) {
    return res.status(400).json({ message: 'Host header required' });
  }
  const allowedHosts = [
    'localhost',
    'localhost:3012',
    'localhost:3000',
    '127.0.0.1',
    '127.0.0.1:3012',
    '127.0.0.1:3000',
    'vinoth-sntl.uk',
    'api.vinoth-sntl.uk',
  ];
  const allowedDevHosts = process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(',') : [];
  const allAllowed = [...allowedHosts, ...allowedDevHosts];
  const hostname = host.split(':')[0];
  if (!allAllowed.includes(host) && !allAllowed.includes(hostname)) {
    return res.status(400).json({ message: 'Invalid host header' });
  }
  next();
}

module.exports = hostValidation;
