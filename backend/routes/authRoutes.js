const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Setup Status & First-Time Setup Routes
router.get('/setup-status', authController.getSetupStatus);
router.post('/setup-admin', authController.setupAdmin);

// Login & Security PIN Endpoints
router.post('/verify-pin', authController.verifyPin);
router.post('/login', authController.login);
router.post('/verify-password', authController.login);

// Password Reset Routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-token', authController.verifyToken);

module.exports = router;
