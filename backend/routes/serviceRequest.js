const express = require('express');
const router = express.Router();
const serviceRequestController = require('../controllers/serviceRequestController');
const { authorizeRoles } = require('../middleware/authorize');

// User creates a service request
router.post('/', authorizeRoles('customer'), serviceRequestController.createServiceRequest);
// User gets their own service requests
router.get('/my', authorizeRoles('customer'), serviceRequestController.getUserServiceRequests);
// Mechanic gets their assigned jobs
router.get('/mechanic', authorizeRoles('mechanic'), serviceRequestController.getMechanicJobs);
// Mechanic accepts a job and sets start time
router.put('/accept', authorizeRoles('mechanic'), serviceRequestController.mechanicAcceptJob);
// Mechanic updates job status
router.put('/status', authorizeRoles('mechanic'), serviceRequestController.updateJobStatus);
// Admin assigns mechanic to job
router.put('/assign', authorizeRoles('admin'), serviceRequestController.assignMechanic);
// Admin gets all service requests
router.get('/', authorizeRoles('admin'), serviceRequestController.getAllServiceRequests);

module.exports = router;
