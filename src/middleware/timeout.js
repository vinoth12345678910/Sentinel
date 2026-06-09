function timeoutMiddleware(req, res, next) {
  const timer = setTimeout(() => {
    if (!res.headersSent) {
      res.status(503).json({ message: 'Request timeout' });
    }
    req.destroy();
  }, 10000);

  res.on('finish', () => clearTimeout(timer));
  next();
}

module.exports = timeoutMiddleware;
