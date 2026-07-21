// Mechanic accepts a pending job, sets start time, and confirms
const mechanicAcceptJob = async (req, res) => {
  try {
    const { requestId, startTime } = req.body;
    const mechanicId = req.user.userId;

    // Validate startTime (must be between 08:00 and 17:00)
    const [h, m] = startTime.split(':').map(Number);
    if (
      h < 8 || h > 17 || m < 0 || m > 59 || (h === 17 && m > 0)
    ) {
      return res.status(400).json({ message: 'Start time must be between 08:00 and 17:00.' });
    }

    const serviceRequest = await ServiceRequest.findById(requestId).populate('user');
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });
    if (serviceRequest.status !== 'pending' || serviceRequest.mechanic) {
      return res.status(400).json({ message: 'Job is not available for acceptance.' });
    }

    serviceRequest.mechanic = mechanicId;
    serviceRequest.status = 'in-progress';
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
    res.status(500).json({ message: error.message });
  }
};
const ServiceRequest = require('../models/serviceRequest');
const Mechanic = require('../models/mechanic');

// User creates a service request
const createServiceRequest = async (req, res) => {
  try {
    const { serviceType, description } = req.body;
    const userId = req.user.userId;

    const serviceRequest = await ServiceRequest.create({
      user: userId,
      serviceType,
      description
    });

    res.status(201).json({
      message: 'Service request created',
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin assigns a mechanic to a job
const assignMechanic = async (req, res) => {
  try {
    const { requestId, mechanicId } = req.body;
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });

    serviceRequest.mechanic = mechanicId;
    serviceRequest.status = 'in-progress';
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
    res.status(500).json({ message: error.message });
  }
};

// Mechanic updates job status
const updateJobStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const serviceRequest = await ServiceRequest.findById(requestId);
    if (!serviceRequest) return res.status(404).json({ message: 'Service request not found' });

    serviceRequest.status = status;
    await serviceRequest.save();

    res.status(200).json({
      message: 'Job status updated',
      serviceRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// User gets their own service requests
const getUserServiceRequests = async (req, res) => {
  try {
    const userId = req.user.userId;
    const requests = await ServiceRequest.find({ user: userId }).populate('mechanic');
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mechanic gets their assigned jobs
const getMechanicJobs = async (req, res) => {
  try {
    const mechanicId = req.user.userId;
    const jobs = await ServiceRequest.find({ mechanic: mechanicId });
    res.status(200).json({ jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
