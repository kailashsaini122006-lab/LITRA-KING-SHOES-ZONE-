const express = require('express');
const router = express.Router();
const aiVideoController = require('../controllers/aiVideoController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected admin routes for AI video operations
router.get('/status', authMiddleware, aiVideoController.getStatus);
router.post('/config', authMiddleware, aiVideoController.updateConfig);
router.post('/test-connection', authMiddleware, aiVideoController.testConnection);
router.post('/generate', authMiddleware, aiVideoController.generate);
router.get('/job/:jobId', authMiddleware, aiVideoController.getJobStatus);
router.post('/save', authMiddleware, aiVideoController.saveVideo);
router.delete('/:productId', authMiddleware, aiVideoController.deleteVideo);
router.patch('/:productId/toggle', authMiddleware, aiVideoController.toggleVideo);
router.post('/:productId/hero', authMiddleware, aiVideoController.setHeroVideo);

module.exports = router;
