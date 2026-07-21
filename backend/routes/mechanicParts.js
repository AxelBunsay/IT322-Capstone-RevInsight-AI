const express = require('express');
const router = express.Router();
const {
  getPartsForMechanic,
  getPendingServiceRequests,
  acceptServiceRequest,
  getAvailableJobs,
  getMechanicJobsById,
  getMechanicStats,
  acceptMechanicJob,
  startMechanicJob,
  completeMechanicJob
} = require('../controllers/mechanicControllers/partsController');
const { authorizeRoles } = require('../middleware/authorize');

// Public: no auth required (mechanic frontend will send its own token if needed)
router.get('/parts', getPartsForMechanic);

// Mechanic dashboard and jobs routes
router.get('/service-requests/pending', authorizeRoles('mechanic'), getPendingServiceRequests);
router.post('/service-requests/:requestId/accept', authorizeRoles('mechanic'), acceptServiceRequest);
router.get('/jobs/available', authorizeRoles('mechanic'), getAvailableJobs);
router.get('/:mechanicId/jobs', authorizeRoles('mechanic'), getMechanicJobsById);
router.get('/:mechanicId/stats', authorizeRoles('mechanic'), getMechanicStats);
router.post('/jobs/:jobId/accept', authorizeRoles('mechanic'), acceptMechanicJob);
router.post('/jobs/:jobId/start', authorizeRoles('mechanic'), startMechanicJob);
router.post('/jobs/:jobId/complete', authorizeRoles('mechanic'), completeMechanicJob);

module.exports = router;
