const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const authMiddleware = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Middleware to optionally attach admin user if token is present
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
    } catch {
      // Ignore invalid token for public endpoint
    }
  }
  next();
}

// Public GET settings (with optional admin enrichment)
router.get('/', optionalAuth, siteSettingsController.getSettings);

// Admin PUT settings (Protected)
router.put('/', authMiddleware, siteSettingsController.updateSettings);

module.exports = router;
