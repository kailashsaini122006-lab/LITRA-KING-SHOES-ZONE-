const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  size: { type: Number, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customer: {
      name: { type: String, required: [true, 'Customer name is required'], trim: true },
      phone: { type: String, required: [true, 'Mobile number is required'], trim: true },
      email: { type: String, trim: true, lowercase: true, default: '' },
      address: { type: String, required: [true, 'Address is required'], trim: true },
      area: { type: String, default: '', trim: true },
      landmark: { type: String, default: '', trim: true },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, default: 'Rajasthan', trim: true },
      pincode: { type: String, required: [true, 'Pincode is required'], trim: true },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    deliveryDistance: { type: Number, default: 0 },
    deliveryDistanceKm: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      default: 'COD',
      enum: ['COD', 'Razorpay', 'Online Payment', 'UPI'],
    },
    paymentStatus: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Pending Verification', 'Payment Processing', 'Paid', 'Failed', 'Payment Failed'],
    },
    orderStatus: {
      type: String,
      default: 'Pending',
      enum: ['Pending', 'Confirmed', 'Packed', 'Out for Delivery', 'Customer Reached', 'Shipped', 'Delivered', 'Cancelled'],
    },
    estimatedDeliveryTime: { type: String, default: '' },
    expectedDeliveryDate: { type: String, default: '' },
    transactionId: { type: String, default: null },
    razorpayOrderId: { type: String, default: null },
    // ── Delivery Verification OTP Fields ──────────────────────────────────────
    deliveryOtpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpVerified: { type: Boolean, default: false },
    otpVerifiedAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    deliveryCompletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
