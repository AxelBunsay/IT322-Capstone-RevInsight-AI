const express = require('express');
const router = express.Router();
const { createPaymentIntent, confirmPayment, stripeWebhook } = require('../controllers/paymentController');
const { authorizeRoles } = require('../middleware/authorize');

router.post('/create-payment-intent', authorizeRoles('customer'), createPaymentIntent);
router.post('/confirm-payment', authorizeRoles('customer'), confirmPayment);

router.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

module.exports = router;