const express = require('express');
const router = express.Router();
const productsController = require('../controllers/productsController');

router.get('/products', productsController.listProducts);
router.post('/products', productsController.createProduct);
router.put('/products/:id', productsController.updateProduct);
router.delete('/products/:id', productsController.deleteProduct);

router.get('/categories', productsController.listCategories);
router.post('/categories', productsController.createCategory);
router.delete('/categories/:id', productsController.deleteCategory);

module.exports = router;
