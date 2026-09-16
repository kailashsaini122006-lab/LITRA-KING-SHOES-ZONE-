const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');

// Public Product Routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin Product Routes (Protected by authMiddleware)
router.post('/upload-image', authMiddleware, productController.uploadProductImage);
router.post('/', authMiddleware, productController.createProduct);
router.put('/:id', authMiddleware, productController.updateProduct);
router.patch('/:id/stock', authMiddleware, productController.toggleProductStock);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;

