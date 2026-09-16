const mongoose = require('mongoose');

const deliveryHandoverSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      trim: true,
      index: true,
    },
    orderRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true,
    },
    productName: {
      type: String,
      default: 'LITRA KING Footwear',
      trim: true,
    },
    productImage: {
      type: String,
      default: '',
      trim: true,
    },
    productQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      default: 'COD',
      trim: true,
    },
    paymentStatus: {
      type: String,
      default: 'Pending',
      trim: true,
    },
    deliveryBoyName: {
      type: String,
      required: [true, 'Delivery boy name is required'],
      trim: true,
    },
    deliveryBoyPhone: {
      type: String,
      required: [true, 'Delivery boy phone number is required'],
      trim: true,
    },
    deliveryBoyReceived: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'Yes',
    },
    otpVerificationStatus: {
      type: String,
      enum: ['Pending', 'OTP Verified', 'Failed', 'N/A'],
      default: 'Pending',
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    handoverDate: {
      type: String,
      required: true,
      trim: true,
    },
    handoverTime: {
      type: String,
      required: true,
      trim: true,
    },
    exactTimestamp: {
      type: Date,
      default: Date.now,
    },
    markedByAdmin: {
      type: String,
      default: 'Admin',
      trim: true,
    },
    handoverStatus: {
      type: String,
      enum: ['Pending Handover', 'Product Handed Over', 'OTP Verified', 'Out for Delivery', 'Completed'],
      default: 'Product Handed Over',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Explicitly ensure NO automatic TTL index or expiration logic exists
module.exports = mongoose.model('DeliveryHandover', deliveryHandoverSchema);
