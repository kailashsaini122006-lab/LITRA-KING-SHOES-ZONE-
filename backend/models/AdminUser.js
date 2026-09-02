const mongoose = require('mongoose');

const adminUserSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      default: 'admin',
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    securityPin: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      default: 'admin',
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpires: {
      type: Date,
      default: null,
    },
    resetOtpUsed: {
      type: Boolean,
      default: false,
    },
    pinResetOtp: {
      type: String,
      default: null,
    },
    pinResetOtpExpires: {
      type: Date,
      default: null,
    },
    pinResetOtpUsed: {
      type: Boolean,
      default: false,
    },
    pinResetAttempts: {
      type: Number,
      default: 0,
    },
    pinResetLastRequested: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
