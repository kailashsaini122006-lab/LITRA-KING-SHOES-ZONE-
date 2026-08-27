const Inquiry = require('../models/Inquiry');
const { sendInquiryEmail } = require('../utils/emailService');

// POST /api/inquiries
const createInquiry = async (req, res) => {
  try {
    const { name, phone, inquiryType, message } = req.body;

    const missing = [];
    if (!name || !name.trim()) missing.push('Your Name');
    if (!phone || !phone.trim()) missing.push('Phone Number');
    if (!inquiryType || !inquiryType.trim()) missing.push('Inquiry Type');
    if (!message || !message.trim()) missing.push('Message / Requirements');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in required fields: ${missing.join(', ')}`,
      });
    }

    const cleanPhone = phone.toString().trim().replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit mobile number.',
      });
    }

    // Save to MongoDB (inquiries collection)
    const inquiry = await Inquiry.create({
      name: name.trim(),
      phone: cleanPhone,
      inquiryType: inquiryType.trim(),
      message: message.trim(),
    });

    console.log(`✅ [MongoDB Saved] New Instant Inquiry created for ${inquiry.name} (${inquiry.phone})`);

    // Dispatch email notification if SMTP is configured
    sendInquiryEmail(inquiry).catch((err) => {
      console.error('Failed to send notification email:', err.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Data Added Successfully!',
      data: inquiry,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0],
      });
    }

    console.error('Error saving inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save inquiry to MongoDB: ' + error.message,
    });
  }
};

// GET /api/inquiries
const getInquiries = async (req, res) => {
  try {
    const records = await Inquiry.find().sort({ createdAt: -1 }).limit(100);
    return res.json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch inquiries: ' + error.message,
    });
  }
};

module.exports = { createInquiry, getInquiries };
