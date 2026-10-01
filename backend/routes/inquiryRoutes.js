const express = require('express');
const router = express.Router();
const { createInquiry, getInquiries } = require('../controllers/inquiryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Customer Inquiry Submission
router.post('/', createInquiry);

// Admin Only: View all customer inquiries
router.get('/', authMiddleware, getInquiries);

module.exports = router;
