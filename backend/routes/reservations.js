const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../middleware/authorize');
const reservations = require('../controllers/reservationController');
const upload = require('../middleware/upload');
const paymentUpload = require('../middleware/paymentUpload');

router.get('/settings', authorizeRoles('customer'), reservations.getPublicSettings);
router.get('/shop-settings', reservations.getShopSettings);
router.post('/', authorizeRoles('customer'), reservations.createReservation);
router.get('/', authorizeRoles('customer'), reservations.getCustomerReservations);
router.get('/:id', authorizeRoles('customer'), reservations.getCustomerReservation);
router.post('/:id/payment', authorizeRoles('customer'), (req, res, next) => {
  paymentUpload.single('proof')(req, res, (error) => {
    if (error) return res.status(400).json({
      success: false,
      message: error.code === 'LIMIT_FILE_SIZE' ? 'Receipt image must be 2 MB or smaller.' : error.message || 'Payment proof could not be uploaded.'
    });
    next();
  });
}, reservations.submitPayment);
router.post('/:id/cancel', authorizeRoles('customer'), reservations.cancelCustomerReservation);

module.exports = router;
