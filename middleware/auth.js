const tokenService = require('../services/tokenService');

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Kiểm tra token có trong blacklist không
    const isBlacklisted = await tokenService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Token has been revoked' });
    }

    // Verify token using Redis
    const decoded = await tokenService.verifyToken(token);
    
    // Add user from payload
    req.user = decoded;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    if (err.message === 'Token not found in Redis') {
      return res.status(401).json({ message: 'Session expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 