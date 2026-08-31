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

// Security PIN Reset Routes
router.get('/security-pin/masked-email', authController.getMaskedAdminEmail);
router.post('/security-pin/forgot', authController.forgotSecurityPin);
router.post('/security-pin/verify-reset-code', authController.verifySecurityPinResetCode);
router.post('/security-pin/reset', authController.resetSecurityPin);
router.post('/forgot-pin', authController.forgotSecurityPin);
router.post('/verify-pin-otp', authController.verifySecurityPinResetCode);
router.post('/reset-pin', authController.resetSecurityPin);

// Password Reset Routes
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-otp', authController.verifyOtp);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-token', authController.verifyToken);

module.exports = router;
