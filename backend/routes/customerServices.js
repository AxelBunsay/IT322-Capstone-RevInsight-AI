const express = require('express');
const router = express.Router();
const { authorizeRoles } = require('../middleware/authorize');
const customerServices = require('../controllers/customerServiceController');
const services = require('../controllers/serviceController');

router.get('/', services.getPublicServices);
router.get('/:id', services.getPublicService);
router.get('/:id/slots', customerServices.getServiceSlots);
router.post('/bookings', authorizeRoles('customer'), customerServices.createServiceBookings);

module.exports = router;
