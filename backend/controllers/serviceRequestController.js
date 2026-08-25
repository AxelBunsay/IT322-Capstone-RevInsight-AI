// Mechanic accepts a pending job, sets start time, and confirms
const mechanicAcceptJob = async (req, res) => {
  try {
    const { requestId, startTime } = req.body;
    const mechanicId = req.user.userId;

    if (!requestId || !startTime) {
      return res.status(400).json({ message: 'Request ID and start time are required' });
    }

    // Validate startTime (must be between 08:00 and 17:00)
    const [h, m] = startTime.split(':').map(Number);
    if (
      h < 8 || h > 17 || m < 0 || m > 59 || (h === 17 && m > 0)
    ) {
      return res.status(400).json({ message: 'Start time must be between 08:00 and 17:00.' });
    }

    const serviceRequest = await ServiceRequest.findById(requestId).populate('user');
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });
    if (serviceRequest.mechanic?.toString() !== mechanicId || serviceRequest.status !== 'confirmed') {
      return res.status(400).json({ message: 'Job is not available for acceptance.' });
    }

    serviceRequest.mechanic = mechanicId;
    serviceRequest.status = 'accepted';
    serviceRequest.startTime = startTime;
    await serviceRequest.save();

    // Notification stubs (replace with real notification logic)
    console.log(`NOTIFY ADMIN: Mechanic ${mechanicId} accepted job ${requestId} for user ${serviceRequest.user._id}`);
    console.log(`NOTIFY USER: Your service request is accepted by mechanic ${mechanicId} and will start at ${startTime}`);

    res.status(200).json({
      message: 'Job accepted and start time set',
      serviceRequest
    });
  } catch (error) {
    console.error('[mechanicAcceptJob] error', error);
    res.status(500).json({ message: 'Failed to accept job. Please try again.' });
  }
};
const ServiceRequest = require('../models/serviceRequest');
const Mechanic = require('../models/mechanic');

// User creates a service request
const createServiceRequest = async (req, res) => {
  try {
    const { serviceType, description, mechanicId } = req.body;
    const userId = req.user.userId;

    if (!serviceType || !description) {
      return res.status(400).json({ message: 'Service type and description are required' });
    }
    if (!mechanicId) return res.status(400).json({ message: 'Please select a mechanic' });
    const mechanic = await Mechanic.findOne({ _id: mechanicId, isActive: true });
    if (!mechanic) return res.status(400).json({ message: 'Selected mechanic is not available' });

    const serviceRequest = await ServiceRequest.create({
      user: userId,
      serviceType,
      description,
      mechanic: mechanicId
    });

    res.status(201).json({
      message: 'Service request created',
      serviceRequest
    });
  } catch (error) {
    console.error('[createServiceRequest] error', error);
    res.status(500).json({ message: 'Failed to create service request. Please try again.' });
  }
};

// Admin assigns a mechanic to a job
const assignMechanic = async (req, res) => {
  try {
    const { requestId, mechanicId } = req.body;
    const mechanic = await Mechanic.findOne({ _id: mechanicId, isActive: true });
    if (!mechanic) return res.status(400).json({ message: 'Mechanic is not available' });
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });

    serviceRequest.mechanic = mechanicId;
    serviceRequest.status = 'confirmed';
    await serviceRequest.save();

    res.status(200).json({
      message: 'Mechanic assigned',
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all service requests (admin)
const getAllServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find().populate('user').populate('mechanic');
    res.status(200).json({ requests });
  } catch (error) {
    console.error('[getAllServiceRequests] error', error);
    res.status(500).json({ message: 'Failed to load service requests. Please try again.' });
  }
};

// Mechanic updates job status
const updateJobStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const validStatuses = ['in-progress', 'completed', 'declined'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });
    if (!serviceRequest.mechanic || serviceRequest.mechanic.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only update your assigned jobs' });
    }
    const allowedTransitions = {
      confirmed: ['declined'],
      accepted: ['in-progress'],
      'in-progress': ['completed']
    };
    if (!allowedTransitions[serviceRequest.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot change status from ${serviceRequest.status} to ${status}` });
    }

    serviceRequest.status = status;
    await serviceRequest.save();

    res.status(200).json({
      message: 'Job status updated',
      serviceRequest
    });
  } catch (error) {
    console.error('[updateJobStatus] error', error);
    res.status(500).json({ message: 'Failed to update job status. Please try again.' });
  }
};

// User gets their own service requests
const getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await ServiceRequest.find({ user: userId }).populate('mechanic');
    res.status(200).json({ requests });
  } catch (error) {
    console.error('[getUserServiceRequests] error', error);
    res.status(500).json({ message: 'Failed to load your service requests. Please try again.' });
  }
};

// Mechanic gets their assigned jobs
const getMechanicJobs = async (req, res) => {
  try {
    const mechanicId = req.user.userId;
    const jobs = await ServiceRequest.find({ mechanic: mechanicId });
    res.status(200).json({ jobs });
  } catch (error) {
    console.error('[getMechanicJobs] error', error);
    res.status(500).json({ message: 'Failed to load your jobs. Please try again.' });
  }
};

module.exports = {
  createServiceRequest,
  assignMechanic,
  getAllServiceRequests,
  updateJobStatus,
  getUserServiceRequests,
  getMechanicJobs
  ,mechanicAcceptJob
};
