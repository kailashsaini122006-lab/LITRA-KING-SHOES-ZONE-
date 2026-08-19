const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'],
    },
    inquiryType: {
      type: String,
      required: [true, 'Inquiry type is required'],
      enum: {
        values: ['Wholesale Inquiry', 'Retail Purchase', 'Store Visit'],
        message: 'Invalid inquiry type selected',
      },
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [5, 'Message must be at least 5 characters'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true, // automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model('Inquiry', inquirySchema);
