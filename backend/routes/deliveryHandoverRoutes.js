const express = require('express');
const router = express.Router();
const deliveryHandoverController = require('../controllers/deliveryHandoverController');
const authMiddleware = require('../middleware/authMiddleware');

// All Delivery Handover endpoints are Admin protected
router.post('/', authMiddleware, deliveryHandoverController.createHandoverRecord);
router.get('/', authMiddleware, deliveryHandoverController.getHandoverRecords);
router.get('/:id', authMiddleware, deliveryHandoverController.getHandoverDetails);

module.exports = router;
