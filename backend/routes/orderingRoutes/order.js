const express = require('express');
const router = express.Router();

const {
  checkout,
  reorderOrder,
  getCustomerOrders
} = require('../../controllers/userControllers/orderController');

const { authorizeRoles } = require('../../middleware/authorize');

// All routes are protected for customers only
router.post('/checkout', authorizeRoles('customer'), checkout);
router.post('/:orderId/reorder', authorizeRoles('customer'), reorderOrder);
router.get('/', authorizeRoles('customer'), getCustomerOrders);

module.exports = router;