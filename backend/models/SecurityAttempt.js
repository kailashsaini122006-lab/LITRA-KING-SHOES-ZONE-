const mongoose = require('mongoose');

const securityAttemptSchema = new mongoose.Schema(
  {
    attemptType: {
      type: String,
      enum: ['WRONG_PASSWORD', 'UNAUTHORIZED_ACCESS', 'RATE_LIMITED', 'FAILED_OTP'],
      required: true,
    },
    ipAddress: {
      type: String,
      default: 'Unknown IP',
    },
    userAgent: {
      type: String,
      default: 'Unknown User-Agent',
    },
    deviceInfo: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      default: 'Security Warning: Unauthorized access attempt detected.',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SecurityAttempt', securityAttemptSchema);
