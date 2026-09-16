const crypto = require('crypto');
const DeliveryHandover = require('../models/DeliveryHandover');
const Order = require('../models/Order');

/**
 * Helper to format Date & Time nicely for handover records
 */
function getFormattedDateTime(dateObj = new Date()) {
  const optionsDate = { day: '2-digit', month: 'short', year: 'numeric' };
  const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };

  const handoverDate = dateObj.toLocaleDateString('en-IN', optionsDate);
  const handoverTime = dateObj.toLocaleTimeString('en-IN', optionsTime);

  return { handoverDate, handoverTime };
}

/**
 * POST /api/delivery-handover
 * Admin Protected: Create a permanent Delivery Handover record
 */
exports.createHandoverRecord = async (req, res) => {
  try {
    const {
      orderId,
      deliveryBoyName,
      deliveryBoyPhone,
      deliveryBoyReceived = 'Yes',
      handoverStatus = 'Product Handed Over',
      notes = '',
      otpCode,
      allowUpdate = false,
    } = req.body;

    // 1. Validation: Required fields
    if (!orderId || !orderId.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required to create a delivery handover record.',
      });
    }

    if (!deliveryBoyName || !deliveryBoyName.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Boy Name is required.',
      });
    }

    if (!deliveryBoyPhone || !deliveryBoyPhone.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Delivery Boy Phone number is required.',
      });
    }

    // 2. STRICT REQUIREMENT: Delivery OTP is MANDATORY for all handovers
    if (!otpCode || !otpCode.toString().trim()) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP is required. Please generate/send the OTP first.',
      });
    }

    const cleanOtp = otpCode.toString().trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Delivery OTP format. Please enter a valid 6-digit OTP.',
      });
    }

    const cleanOrderId = orderId.toString().trim().replace(/^#/, '');

    // 3. Fetch target Order from MongoDB
    let order = await Order.findOne({ orderId: cleanOrderId.toUpperCase() });
    if (!order && cleanOrderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(cleanOrderId);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order #${cleanOrderId} not found in database.`,
      });
    }

    // 4. Duplicate Handover Prevention Check
    const existingHandover = await DeliveryHandover.findOne({ orderId: order.orderId }).sort({ createdAt: -1 });
    if (existingHandover && !allowUpdate) {
      return res.status(400).json({
        success: false,
        alreadyHandedOver: true,
        message: `Order #${order.orderId} has already been handed over to delivery boy "${existingHandover.deliveryBoyName}" on ${existingHandover.handoverDate} at ${existingHandover.handoverTime}. Duplicate handover prevented.`,
        existingHandover,
      });
    }

    // 5. STRICT OTP VERIFICATION LOGIC USING EXISTING ORDER OTP FLOW
    let isOtpVerified = Boolean(order.otpVerified);

    if (!isOtpVerified) {
      // Check if an active OTP hash exists on the order
      if (!order.deliveryOtpHash) {
        return res.status(400).json({
          success: false,
          message: 'No active Delivery OTP exists for this order. Please use Customer Reached or Resend Delivery OTP first.',
        });
      }

      // SHA-256 hash comparison against existing order.deliveryOtpHash
      const submittedHash = crypto.createHash('sha256').update(cleanOtp).digest('hex');
      if (submittedHash !== order.deliveryOtpHash) {
        // Invalid OTP - REJECT handover completely!
        return res.status(400).json({
          success: false,
          message: 'Invalid Delivery OTP. Product cannot be marked as handed over.',
        });
      }

      // OTP is valid! Mark OTP verified on the existing Order model
      isOtpVerified = true;
      order.otpVerified = true;
      order.otpVerifiedAt = new Date();
      order.deliveryOtpHash = null; // Clear hash after successful verification
      await order.save();
    }

    // Double-check OTP verification safety
    if (!isOtpVerified) {
      return res.status(400).json({
        success: false,
        message: 'Delivery OTP verification failed. Handover cannot be completed without a verified OTP.',
      });
    }

    // Determine Admin username/identity safely from JWT payload
    const markedByAdmin = req.user?.username || req.user?.email || 'Admin';

    // 6. Construct product summaries safely without destructive mutation
    let productName = 'LITRA KING Footwear';
    let productImage = '';
    let productQuantity = 1;

    if (Array.isArray(order.items) && order.items.length > 0) {
      productName = order.items.map((item) => item.name).join(', ');
      productImage = order.items[0]?.image || '';
      productQuantity = order.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    }

    const { subtotal = 0, deliveryCharge = 0 } = order;
    const totalAmount = order.totalAmount !== undefined && order.totalAmount !== null
      ? Number(order.totalAmount)
      : (subtotal + deliveryCharge);

    const now = new Date();
    const { handoverDate, handoverTime } = getFormattedDateTime(now);

    // 7. Create permanent DeliveryHandover record in MongoDB ONLY AFTER SUCCESSFUL OTP VERIFICATION
    const handoverRecord = new DeliveryHandover({
      orderId: order.orderId,
      orderRef: order._id,
      customerName: order.customer?.name || 'Customer',
      customerPhone: order.customer?.phone || '',
      productName,
      productImage,
      productQuantity,
      totalAmount,
      paymentMethod: order.paymentMethod || 'COD',
      paymentStatus: order.paymentStatus || 'Pending',
      deliveryBoyName: deliveryBoyName.trim(),
      deliveryBoyPhone: deliveryBoyPhone.trim(),
      deliveryBoyReceived: deliveryBoyReceived === 'No' ? 'No' : 'Yes',
      otpVerificationStatus: 'OTP Verified',
      otpVerified: true,
      handoverDate,
      handoverTime,
      exactTimestamp: now,
      markedByAdmin,
      handoverStatus: handoverStatus === 'Pending Handover' ? 'OTP Verified' : (handoverStatus || 'Product Handed Over'),
      notes: notes.trim(),
    });

    await handoverRecord.save();

    // 8. Update order status to Out for Delivery if appropriate without modifying original order data destructively
    if (order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed' || order.orderStatus === 'Packed' || order.orderStatus === 'Customer Reached') {
      order.orderStatus = 'Out for Delivery';
      await order.save();
    }

    console.log(`📦 [Delivery Handover Recorded & OTP Verified] Order #${order.orderId} handed over to Delivery Boy: ${deliveryBoyName} (${deliveryBoyPhone}).`);

    return res.status(201).json({
      success: true,
      message: 'Product successfully handed over to delivery boy.',
      handover: handoverRecord,
      orderId: order.orderId,
      deliveryBoy: deliveryBoyName,
      date: handoverDate,
      time: handoverTime,
      otpVerified: true,
    });
  } catch (err) {
    console.error('Error recording delivery handover:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to record delivery handover: ' + err.message,
    });
  }
};

/**
 * GET /api/delivery-handover
 * Admin Protected: Retrieve all delivery handover records with search & filters
 */
exports.getHandoverRecords = async (req, res) => {
  try {
    const { search, status, date } = req.query;
    const filter = {};

    if (status && status !== 'All') {
      filter.handoverStatus = status;
    }

    if (date) {
      filter.handoverDate = { $regex: date, $options: 'i' };
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderId: searchRegex },
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { deliveryBoyName: searchRegex },
        { deliveryBoyPhone: searchRegex },
      ];
    }

    // Fetch permanent handover records, sorted latest first
    const handovers = await DeliveryHandover.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: handovers.length,
      handovers,
    });
  } catch (err) {
    console.error('Error fetching handover records:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch handover records: ' + err.message,
    });
  }
};

/**
 * GET /api/delivery-handover/:id
 * Admin Protected: Get complete detail & history timeline for a specific handover
 */
exports.getHandoverDetails = async (req, res) => {
  try {
    const { id } = req.params;

    let handover = await DeliveryHandover.findById(id);
    if (!handover) {
      const cleanId = id.trim().replace(/^#/, '');
      handover = await DeliveryHandover.findOne({ orderId: cleanId.toUpperCase() }).sort({ createdAt: -1 });
    }

    if (!handover) {
      return res.status(404).json({
        success: false,
        message: `Delivery Handover record not found for "${id}".`,
      });
    }

    // Also fetch all historical handovers for this order to build a timeline
    const timeline = await DeliveryHandover.find({ orderId: handover.orderId }).sort({ createdAt: -1 });

    // Fetch current order status reference
    const order = await Order.findOne({ orderId: handover.orderId });

    return res.json({
      success: true,
      handover,
      timeline,
      order,
    });
  } catch (err) {
    console.error('Error fetching handover details:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch handover details: ' + err.message,
    });
  }
};
