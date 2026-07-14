const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct
} = require('../../controllers/adminControllers/productController');

const { protect } = require('../../middleware/adminAuth');
const upload = require('../../middleware/upload');

// All admin write routes are protected
router.post('/', protect, upload.single('image'), createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', protect, upload.single('image'), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;