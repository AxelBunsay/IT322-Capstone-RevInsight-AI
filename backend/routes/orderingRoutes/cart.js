const express = require('express');
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart
} = require('../../controllers/userControllers/cartController');
const { authorizeRoles } = require('../../middleware/authorize');

// All routes are protected for customers only
router.post('/add', authorizeRoles('customer'), addToCart);
router.get('/', authorizeRoles('customer'), getCart);
router.delete('/remove/:productId', authorizeRoles('customer'), removeFromCart);
router.put('/update/:productId', authorizeRoles('customer'), updateCartQuantity);
router.delete('/clear', authorizeRoles('customer'), clearCart);

module.exports = router;