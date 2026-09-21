const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../../controllers/products/productController');

const { authenticate, adminOnly } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

router.post('/', adminOnly, upload.single('image'), createProduct);
router.get('/', getProducts);
router.get('/:id', authenticate, getProduct);
router.put('/:id', adminOnly, upload.single('image'), updateProduct);
router.delete('/:id', adminOnly, deleteProduct);

module.exports = router;