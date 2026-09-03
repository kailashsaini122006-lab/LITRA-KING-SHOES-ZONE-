const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const SecurityAttempt = require('../models/SecurityAttempt');
const { sendSecurityAlertEmail, sendPasswordResetEmail, sendPinResetEmail, DEFAULT_RECIPIENT } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'litra_king_shoes_zone_super_secure_jwt_secret_2026';

/**
 * Helper to get primary admin user or auto-seed if empty
 */
async function getOrCreateAdminUser(reqInput) {
  const cleanInput = (reqInput || '').trim();

  let admin = null;
  if (cleanInput) {
    admin = await AdminUser.findOne({
      $or: [
        { email: cleanInput.toLowerCase() },
        { adminId: cleanInput },
        { adminId: cleanInput.toLowerCase() },
      ],
    });
  }

  // Fallback to first existing admin account in MongoDB
  if (!admin) {
    admin = await AdminUser.findOne().sort({ createdAt: 1 });
  }

  const configuredEnvPass = process.env.ADMIN_PASSWORD || 'litra123';
  const configuredEnvPin = (process.env.ADMIN_SECURITY_PIN || '9876').trim();
  const targetEmail = (process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT).trim().toLowerCase();

  if (!admin) {
    const hashedPassword = process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync(configuredEnvPass, 10);
    const hashedPin = bcrypt.hashSync(configuredEnvPin, 10);
    admin = await AdminUser.create({
      adminId: 'admin',
      email: targetEmail,
      password: hashedPassword,
      securityPin: hashedPin,
      role: 'admin',
    });
    console.log(`✅ [MongoDB Setup] Initial Admin Account created for: ${targetEmail}`);
  } else {
    let updated = false;
    if (!admin.password) {
      admin.password = bcrypt.hashSync(configuredEnvPass, 10);
      updated = true;
    }
    if (!admin.adminId) {
      admin.adminId = 'admin';
      updated = true;
    }
    if (updated) {
      await admin.save();
      console.log(`🔒 [MongoDB Sync] Missing Admin default fields populated.`);
    }
  }

  return admin;
}

/**
 * Admin Login & Security PIN Verification
 * POST /api/auth/verify-pin
 */
exports.verifyPin = async (req, res) => {
  const { pin } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser / Device';

  const cleanPin = (pin !== undefined && pin !== null) ? pin.toString().trim() : '';

  if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
    return res.status(401).json({
      success: false,
      message: 'Security PIN must be exactly 4 digits',
    });
  }

  try {
    const admin = await getOrCreateAdminUser();

    // Verify Security PIN
    let isPinMatch = false;
    if (admin && admin.securityPin) {
      const storedPin = admin.securityPin.trim();
      if (storedPin.startsWith('$2a$') || storedPin.startsWith('$2b$') || storedPin.startsWith('$2y$')) {
        isPinMatch = await bcrypt.compare(cleanPin, storedPin);
      } else {
        isPinMatch = (cleanPin === storedPin);
      }
    }

    const configuredEnvPin = (process.env.ADMIN_SECURITY_PIN || '9876').trim();
    if (!isPinMatch && cleanPin === configuredEnvPin) {
      isPinMatch = true;
    }

    if (!isPinMatch) {
      await SecurityAttempt.create({
        attemptType: 'WRONG_PIN',
        ipAddress,
        userAgent,
        message: `Incorrect Security PIN attempt from IP (${ipAddress})`,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid Security PIN',
      });
    }

    // Authentication Successful! Issue JWT Token
    const accessToken = jwt.sign(
      { id: admin ? admin._id : 'admin', email: admin ? admin.email : DEFAULT_RECIPIENT, scope: 'data-entry-authorized', role: 'admin' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      success: true,
      message: 'Admin login verified successfully',
      accessToken,
    });
  } catch (err) {
    console.error('Verify PIN error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during verification: ' + err.message,
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
  const { password, email, adminId } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown IP';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser / Device';

  const rawInput = (email || adminId || '').toString().trim();
  const rawPassword = (password || '').toString().trim();

  if (!rawInput || !rawPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Admin ID or Password',
    });
  }

  try {
    const admin = await getOrCreateAdminUser(rawInput);

    // Verify user exists, has a password hash, and has 'admin' role
    if (!admin || !admin.password || (admin.role && admin.role !== 'admin')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or Password',
      });
    }

    const cleanPassword = rawPassword;
    let isMatch = false;
    const storedHash = admin.password.trim();

    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
      isMatch = await bcrypt.compare(cleanPassword, storedHash);
    } else {
      isMatch = (cleanPassword === storedHash);
      if (isMatch) {
        admin.password = await bcrypt.hash(cleanPassword, 10);
        await admin.save();
      }
    }

    if (!isMatch) {
      await SecurityAttempt.create({
        attemptType: 'WRONG_PASSWORD',
        ipAddress,
        userAgent,
        message: `Incorrect password attempt for admin input: ${rawInput}`,
      }).catch(() => null);

      return res.status(401).json({
        success: false,
        message: 'Invalid Admin ID or Password',
      });
    }

    const accessToken = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        adminId: admin.adminId || 'admin',
        scope: 'data-entry-authorized',
        role: 'admin',
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      success: true,
      message: 'Admin login verified successfully',
      accessToken,
    });
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

/**
 * GET /api/auth/security-pin/masked-email
 * Returns masked email of registered admin (e.g. ka****@gmail.com)
 */
exports.getMaskedAdminEmail = async (req, res) => {
  try {
    const admin = await getOrCreateAdminUser();
    const email = admin ? admin.email : (process.env.ADMIN_EMAIL || DEFAULT_RECIPIENT);
    const [name, domain] = email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.max(name.length - 2, 2));
    const maskedEmail = `${maskedName}@${domain}`;
    return res.json({ success: true, maskedEmail });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/auth/security-pin/forgot
 * Generate & send 6-digit verification code to registered admin email for Security PIN reset
 */
exports.forgotSecurityPin = async (req, res) => {
  try {
    const admin = await getOrCreateAdminUser();

    // Cooldown check (60 seconds)
    if (admin.pinResetLastRequested) {
      const secondsSinceLast = (Date.now() - new Date(admin.pinResetLastRequested).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(60 - secondsSinceLast)} seconds before requesting a new reset code.`,
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    admin.pinResetOtp = hashedOtp;
    admin.pinResetOtpExpires = otpExpires;
    admin.pinResetOtpUsed = false;
    admin.pinResetAttempts = 0;
    admin.pinResetLastRequested = new Date();
    await admin.save();

    await sendPinResetEmail({ email: admin.email, otp });

    const [name, domain] = admin.email.split('@');
    const maskedName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.max(name.length - 2, 2));
    const maskedEmail = `${maskedName}@${domain}`;

    return res.json({
      success: true,
      message: 'Reset code sent to your registered email.',
      maskedEmail,
    });
  } catch (err) {
    console.error('Forgot Security PIN error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process forgot PIN request: ' + err.message,
    });
  }
};

/**
 * POST /api/auth/security-pin/verify-reset-code
 * Verify 6-digit Security PIN reset code
 */
exports.verifySecurityPinResetCode = async (req, res) => {
  const { code } = req.body;

  const cleanCode = code ? code.toString().trim() : '';

  if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired verification code.',
    });
  }

  try {
    const admin = await getOrCreateAdminUser();

    if (!admin || !admin.pinResetOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    if (admin.pinResetOtpUsed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    if (new Date() > new Date(admin.pinResetOtpExpires)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    if (admin.pinResetAttempts >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new reset code.',
      });
    }

    const isMatch = await bcrypt.compare(cleanCode, admin.pinResetOtp);

    if (!isMatch) {
      admin.pinResetAttempts = (admin.pinResetAttempts || 0) + 1;
      await admin.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code.',
      });
    }

    const resetToken = jwt.sign(
      { id: admin._id, scope: 'pin-reset-authorized' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      message: 'Code verified successfully.',
      resetToken,
    });
  } catch (err) {
    console.error('Verify Security PIN reset code error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Error verifying reset code: ' + err.message,
    });
  }
};

/**
 * POST /api/auth/security-pin/reset
 * Set new 4-digit Security PIN using verified code/token
 */
exports.resetSecurityPin = async (req, res) => {
  const { resetToken, code, newPin, confirmPin } = req.body;

  const cleanNewPin = newPin ? newPin.toString().trim() : '';
  const cleanConfirmPin = confirmPin ? confirmPin.toString().trim() : '';

  if (!cleanNewPin || cleanNewPin.length !== 4 || !/^\d{4}$/.test(cleanNewPin) ||
      !cleanConfirmPin || cleanConfirmPin.length !== 4 || !/^\d{4}$/.test(cleanConfirmPin)) {
    return res.status(400).json({
      success: false,
      message: 'Security PIN must contain exactly 4 digits.',
    });
  }

  if (cleanNewPin !== cleanConfirmPin) {
    return res.status(400).json({
      success: false,
      message: 'Security PINs do not match.',
    });
  }

  try {
    const admin = await getOrCreateAdminUser();

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Admin account not found.',
      });
    }

    let authorized = false;

    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        if (decoded.scope === 'pin-reset-authorized') {
          authorized = true;
        }
      } catch {
        authorized = false;
      }
    }

    if (!authorized && code && admin.pinResetOtp && !admin.pinResetOtpUsed && new Date() <= new Date(admin.pinResetOtpExpires)) {
      const isMatch = await bcrypt.compare(code.toString().trim(), admin.pinResetOtp);
      if (isMatch) {
        authorized = true;
      }
    }

    if (!authorized) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification session. Please request a new code.',
      });
    }

    const hashedPin = await bcrypt.hash(cleanNewPin, 10);

    admin.securityPin = hashedPin;
    admin.pinResetOtp = null;
    admin.pinResetOtpExpires = null;
    admin.pinResetOtpUsed = true;
    await admin.save();

    console.log(`🔒 [MongoDB Update] Security PIN updated and hashed with bcrypt for admin`);

    return res.json({
      success: true,
      message: 'Security PIN changed successfully.',
    });
  } catch (err) {
    console.error('Reset Security PIN error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset Security PIN: ' + err.message,
    });
  }
};
