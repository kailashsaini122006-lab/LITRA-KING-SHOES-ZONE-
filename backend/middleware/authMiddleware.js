const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    console.error('❌  JWT_SECRET environment variable is missing on server.');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: JWT_SECRET is not configured.',
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Missing or invalid authentication token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin' && decoded.scope !== 'data-entry-authorized') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication session expired or invalid. Please re-authenticate.',
    });
  }
}

module.exports = authMiddleware;
