const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const SecurityAttempt = require('../models/SecurityAttempt');
const { sendSecurityAlertEmail, sendPasswordResetEmail, DEFAULT_RECIPIENT } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'litra_king_shoes_zone_super_secure_jwt_secret_2026';

/**
 * Helper to get primary admin user or auto-seed if empty
 */
async function getOrCreateAdminUser(reqEmail) {
  const targetEmail = (reqEmail || process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT).trim().toLowerCase();

  let admin = await AdminUser.findOne({ email: targetEmail });
  if (!admin) {
    admin = await AdminUser.findOne().sort({ createdAt: 1 });
  }

  const configuredEnvPass = process.env.ADMIN_PASSWORD || 'litra123';
  const configuredEnvPin = process.env.ADMIN_SECURITY_PIN || '1234';

  if (!admin) {
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(configuredEnvPass, 10);
    const hashedPin = bcrypt.hashSync(configuredEnvPin, 10);
    admin = await AdminUser.create({
      email: targetEmail,
      password: hashedPassword,
      securityPin: hashedPin,
      role: 'admin',
    });
    console.log(`✅ [MongoDB Setup] Initial Admin Account created for: ${targetEmail}`);
  } else {
    let updated = false;
    if (process.env.ADMIN_PASSWORD && !bcrypt.compareSync(configuredEnvPass, admin.password)) {
      admin.password = bcrypt.hashSync(configuredEnvPass, 10);
      updated = true;
    }
    if (!admin.securityPin || (process.env.ADMIN_SECURITY_PIN && !bcrypt.compareSync(configuredEnvPin, admin.securityPin))) {
      admin.securityPin = bcrypt.hashSync(configuredEnvPin, 10);
      updated = true;
    }
    if (updated) {
      await admin.save();
      console.log(`🔒 [MongoDB Sync] Admin password/PIN updated in MongoDB from .env.`);
    }
  }

  return admin;
}

/**
 * 4-Digit Security PIN Verification
 * POST /api/auth/verify-pin
 */
exports.verifyPin = async (req, res) => {
  const { pin } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser / Device';

  const cleanPin = pin ? pin.toString().trim() : '';
  const configuredEnvPin = (process.env.SECURITY_PIN || process.env.ADMIN_SECURITY_PIN || '1234').trim();

  const securityPinConfigured = !!configuredEnvPin;
  const pinReceived = !!cleanPin;
  const pinLength = cleanPin.length;

  if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
    console.log(`Security PIN configured: ${securityPinConfigured}`);
    console.log(`PIN received: ${pinReceived}`);
    console.log(`PIN length: ${pinLength}`);
    console.log(`PIN comparison result: false`);

    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 4-digit PIN',
    });
  }

  try {
    const admin = await getOrCreateAdminUser();

    let isMatch = false;

    // 1. Direct match with configured ADMIN_SECURITY_PIN in .env
    if (cleanPin === configuredEnvPin) {
      isMatch = true;
      if (admin && (!admin.securityPin || !bcrypt.compareSync(configuredEnvPin, admin.securityPin))) {
        admin.securityPin = await bcrypt.hash(cleanPin, 10);
        await admin.save();
        console.log('🔒 [MongoDB Sync] Updated securityPin in MongoDB to Bcrypt hash.');
      }
    } else if (admin && admin.securityPin) {
      // 2. Bcrypt match with stored hash in MongoDB
      isMatch = await bcrypt.compare(cleanPin, admin.securityPin);
    }

    // Required Console Debug Output (Never logging actual PIN)
    console.log(`Security PIN configured: ${securityPinConfigured}`);
    console.log(`PIN received: ${pinReceived}`);
    console.log(`PIN length: ${pinLength}`);
    console.log(`PIN comparison result: ${isMatch}`);

    if (isMatch) {
      const accessToken = jwt.sign(
        { id: admin ? admin._id : 'admin', email: admin ? admin.email : DEFAULT_RECIPIENT, scope: 'data-entry-authorized', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        success: true,
        message: 'PIN verified successfully',
        accessToken,
      });
    } else {
      await SecurityAttempt.create({
        attemptType: 'WRONG_PASSWORD',
        ipAddress,
        userAgent,
        message: `Incorrect 4-digit Security PIN attempt from IP (${ipAddress})`,
      });

      sendSecurityAlertEmail({
        attemptType: 'WRONG_PASSWORD',
        ipAddress,
        userAgent,
        time: new Date(),
        details: `An incorrect 4-digit Security PIN was entered on Litra King website. Access has been denied.`,
      }).catch((err) => console.error('Alert email dispatch error:', err.message));

      return res.status(401).json({
        success: false,
        message: 'Incorrect Security PIN. Access Denied!',
      });
    }
  } catch (err) {
    console.error('Verify PIN error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during PIN verification: ' + err.message,
    });
  }
};

/**
 * GET /api/auth/setup-status
 * Checks whether an Admin User exists in MongoDB
 */
exports.getSetupStatus = async (req, res) => {
  try {
    const count = await AdminUser.countDocuments({});
    if (count > 0) {
      const admin = await AdminUser.findOne({}).select('email');
      return res.json({ hasAdmin: true, email: admin ? admin.email : '' });
    }
    return res.json({ hasAdmin: false });
  } catch (err) {
    console.error('Error checking setup status:', err.message);
    return res.status(500).json({ hasAdmin: false, error: err.message });
  }
};

/**
 * POST /api/auth/setup-admin
 * First-Time Admin Account Setup (if no admin exists in MongoDB)
 */
exports.setupAdmin = async (req, res) => {
  const { email, password, confirmPassword, pin } = req.body;

  try {
    const existingCount = await AdminUser.countDocuments({});
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin account already exists in database.',
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and Confirm Password do not match.',
      });
    }

    const adminEmail = (email || process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT).trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash((pin || process.env.ADMIN_SECURITY_PIN || '1234').toString().trim(), 10);

    await AdminUser.create({
      email: adminEmail,
      password: hashedPassword,
      securityPin: hashedPin,
      role: 'admin',
    });

    console.log(`🎉 [Admin Setup] First-time Admin created in MongoDB: ${adminEmail}`);

    return res.json({
      success: true,
      message: 'Admin setup successful! You can now log in.',
    });
  } catch (err) {
    console.error('Setup admin error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to setup admin: ' + err.message,
    });
  }
};

/**
 * Password Security Login Verification
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  const { password, email } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser / Device';

  const passwordReceived = !!(password && password.trim() !== '');

  try {
    const admin = await getOrCreateAdminUser(email);
    const adminFound = !!admin;
    const passwordHashExists = !!(admin && admin.password);

    if (!passwordReceived) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    const cleanPassword = password.trim();
    let isMatch = false;

    if (adminFound && passwordHashExists) {
      isMatch = await bcrypt.compare(cleanPassword, admin.password);
      if (!isMatch) {
        const envDefaultPass = process.env.ADMIN_PASSWORD;
        if (envDefaultPass && cleanPassword === envDefaultPass.trim()) {
          isMatch = true;
          admin.password = await bcrypt.hash(cleanPassword, 10);
          await admin.save();
        }
      }
    }

    console.log(`Admin found: ${adminFound}`);
    console.log(`Password hash exists: ${passwordHashExists}`);
    console.log(`Password received: ${passwordReceived}`);
    console.log(`Password comparison result: ${isMatch}`);

    if (isMatch) {
      const accessToken = jwt.sign(
        { id: admin._id, email: admin.email, scope: 'data-entry-authorized', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        success: true,
        message: 'Login successful',
        accessToken,
      });
    } else {
      await SecurityAttempt.create({
        attemptType: 'WRONG_PASSWORD',
        ipAddress,
        userAgent,
        message: `Incorrect password attempt for admin email: ${admin ? admin.email : 'Unknown'}`,
      });

      sendSecurityAlertEmail({
        attemptType: 'WRONG_PASSWORD',
        ipAddress,
        userAgent,
        time: new Date(),
        details: `An incorrect password entry was detected on Litra King website from IP (${ipAddress}). Access has been denied.`,
      }).catch((err) => console.error('Alert email dispatch error:', err.message));

      return res.status(401).json({
        success: false,
        message: 'Incorrect Password. Access Denied!',
      });
    }
  } catch (err) {
    console.error('Login processing error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during password verification: ' + err.message,
    });
  }
};

/**
 * Forgot Password - Send OTP to Registered Admin Email
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email || !email.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your registered admin email address.',
    });
  }

  const targetEmail = email.trim().toLowerCase();

  try {
    const admin = await getOrCreateAdminUser(targetEmail);

    if (admin.email.toLowerCase() !== targetEmail) {
      return res.json({
        success: true,
        message: 'If the email matches our admin records, a password reset OTP code has been sent.',
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    admin.resetOtp = otp;
    admin.resetOtpExpires = otpExpires;
    admin.resetOtpUsed = false;
    await admin.save();

    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔑 [Dev Debug] Generated Password Reset OTP for ${admin.email}: ${otp}`);
    }

    await sendPasswordResetEmail({ email: admin.email, otp });

    return res.json({
      success: true,
      message: `Password reset OTP has been sent successfully to ${admin.email}.`,
    });
  } catch (err) {
    console.error('Forgot password error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request: ' + err.message,
    });
  }
};

/**
 * Verify OTP Code
 * POST /api/auth/verify-otp
 */
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!otp || otp.trim().length !== 6) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid 6-digit OTP code.',
    });
  }

  const targetEmail = (email || '').trim().toLowerCase();

  try {
    const admin = await AdminUser.findOne({
      email: targetEmail || (process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT).toLowerCase(),
    });

    if (!admin || !admin.resetOtp) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found. Please request a new OTP.',
      });
    }

    if (admin.resetOtpUsed) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has already been used. Please request a new OTP.',
      });
    }

    if (new Date() > new Date(admin.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired (valid for 10 minutes only). Please request a new OTP.',
      });
    }

    if (admin.resetOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please enter the correct 6-digit code sent to your email.',
      });
    }

    return res.json({
      success: true,
      message: 'OTP code verified successfully! Now set your new password.',
    });
  } catch (err) {
    console.error('Verify OTP error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error verifying OTP: ' + err.message,
    });
  }
};

/**
 * Reset Password with OTP & Strength Validation
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!otp || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'OTP, New Password, and Confirm Password are all required.',
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirm password do not match.',
    });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#_\-.,;:!+=])[A-Za-z\d@$!%*?&#_\-.,;:!+=]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'Password must be at least 8 characters long and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (e.g. @$!%*?&#).',
    });
  }

  const targetEmail = (email || '').trim().toLowerCase();

  try {
    const admin = await AdminUser.findOne({
      email: targetEmail || (process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT).toLowerCase(),
    });

    if (!admin || !admin.resetOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset session.',
      });
    }

    if (admin.resetOtpUsed) {
      return res.status(400).json({
        success: false,
        message: 'This OTP has already been used once. Please request a new OTP.',
      });
    }

    if (new Date() > new Date(admin.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new OTP.',
      });
    }

    if (admin.resetOtp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code.',
      });
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    admin.password = newHashedPassword;
    admin.resetOtp = null;
    admin.resetOtpExpires = null;
    admin.resetOtpUsed = true;
    await admin.save();

    console.log(`✅ [MongoDB Update] Admin password updated and hashed with bcrypt for: ${admin.email}`);

    return res.json({
      success: true,
      message: '🎉 Password reset successfully! You can now log in using your new password.',
    });
  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password: ' + err.message,
    });
  }
};

/**
 * Check Bearer Token Validity
 * GET /api/auth/verify-token
 */
exports.verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.scope === 'data-entry-authorized') {
      return res.json({ valid: true, user: decoded });
    }
  } catch { }

  return res.status(401).json({ valid: false });
};
