const Inquiry = require('../models/Inquiry');

// POST /api/inquiries
const createInquiry = async (req, res) => {
  try {
    const { name, phone, inquiryType, message } = req.body;

    // --- Basic presence check (before Mongoose validation) ---
    const missing = [];
    if (!name || !name.trim()) missing.push('Name');
    if (!phone || !phone.trim()) missing.push('Phone number');
    if (!inquiryType || !inquiryType.trim()) missing.push('Inquiry type');
    if (!message || !message.trim()) missing.push('Message');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Please fill in: ${missing.join(', ')}`,
      });
    }

    // --- Phone format check ---
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = phone.trim().replace(/\s|-/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 10-digit Indian mobile number (starting with 6-9).',
      });
    }

    // --- Save to MongoDB ---
    const inquiry = await Inquiry.create({
      name: name.trim(),
      phone: cleanPhone,
      inquiryType: inquiryType.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! We will contact you shortly.',
      data: {
        id: inquiry._id,
        name: inquiry.name,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0], // show first error
      });
    }

    console.error('Error saving inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong on our end. Please try again or call us directly.',
    });
  }
};

module.exports = { createInquiry };
