function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    // Owner role can do anything
    if (req.user.role === 'owner' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: `Requires role: ${roles.join(' or ')}` });
  };
}

module.exports = requireRole;
