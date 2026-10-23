const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');
const { authorizeRoles } = require('../middleware/authorize');

router.post('/create-payment-intent', authorizeRoles('customer'), createPaymentIntent);
router.post('/confirm-payment', authorizeRoles('customer'), confirmPayment);

module.exports = router;