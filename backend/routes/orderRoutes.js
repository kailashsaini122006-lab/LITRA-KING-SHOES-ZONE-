const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

// ── Public Customer & Delivery Boy Endpoints ─────────────────────────────────
router.post('/', orderController.createOrder); // COD Order Placement
router.get('/track/:id', orderController.getOrderById); // Order Tracking
router.get('/public/:id', orderController.getOrderById);
router.get('/delivery-boy/assigned', orderController.getAssignedOrdersForDeliveryBoy); // Assigned Orders for Delivery Boy


// ── Public Razorpay Online Payment Endpoints ────────────────────────────────
router.get('/razorpay-key', orderController.getRazorpayKey); // Get Public Key ID safely
router.post('/razorpay-init', orderController.initRazorpayOrder); // Initialize Razorpay Order
router.post('/razorpay-verify', orderController.verifyRazorpayPayment); // Verify HMAC SHA256 Signature

// ── Protected Admin / Delivery OTP Verification Endpoints ──────────────────
router.post('/:id/customer-reached', authMiddleware, orderController.markCustomerReached);
router.post('/:id/verify-otp', authMiddleware, orderController.verifyDeliveryOtp);
router.post('/:id/resend-otp', authMiddleware, orderController.resendDeliveryOtp);
router.post('/:id/delivery-send', authMiddleware, orderController.sendOrderToDeliveryBoy);
router.put('/:id/delivery-send', authMiddleware, orderController.sendOrderToDeliveryBoy);


// ── Protected Admin Endpoints ────────────────────────────────────────────────
router.get('/admin/metrics', authMiddleware, orderController.getOrderMetrics);
router.get('/reports/daily', authMiddleware, orderController.getDailySalesReport);
router.get('/reports/monthly', authMiddleware, orderController.getMonthlySalesReport);
router.get('/reports/orders', authMiddleware, orderController.getOrdersReport);
router.get('/search', authMiddleware, orderController.searchOrdersByEmail);
router.get('/', authMiddleware, orderController.getOrders);
router.get('/:id', orderController.getOrderById); // Dual access for tracking & admin view
router.put('/:id', authMiddleware, orderController.updateOrderStatus);
router.delete('/:id', authMiddleware, orderController.deleteOrder);

module.exports = router;
