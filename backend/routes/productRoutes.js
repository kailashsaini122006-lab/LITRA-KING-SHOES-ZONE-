const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Public Product Routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin Product Routes
router.post('/', productController.createProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

module.exports = router;
