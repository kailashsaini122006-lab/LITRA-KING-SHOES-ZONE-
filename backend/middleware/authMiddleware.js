const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'litra_king_shoes_zone_super_secure_jwt_secret_2026';

function authMiddleware(req, res, next) {
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

    if (decoded.scope !== 'data-entry-authorized') {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions for data entry.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Authentication session expired or invalid. Please re-authenticate with Password.',
    });
  }
}

module.exports = authMiddleware;
