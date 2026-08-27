const express = require('express');
const router = express.Router();
const dataEntryController = require('../controllers/dataEntryController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, dataEntryController.createDataEntry);
router.get('/', authMiddleware, dataEntryController.getDataEntries);

module.exports = router;
