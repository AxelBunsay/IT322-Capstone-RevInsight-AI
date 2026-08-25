const Product = require('../../models/product');
const ServiceRequest = require('../../models/serviceRequest');

const serializeServiceRequest = (request) => {
  const user = request.user;
  const customerName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : 'Customer';

  return {
    _id: request._id,
    id: request._id,
    customerName,
    customerEmail: user?.email || '',
    serviceType: request.serviceType,
    serviceDescription: request.description,
    description: request.description,
    status: request.status,
    mechanic: request.mechanic,
    startTime: request.startTime,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    requestDate: request.createdAt,
    scheduledDate: request.updatedAt
  };
};

// Public endpoint for mechanics to fetch parts
const getPartsForMechanic = async (req, res) => {
  try {
    const products = await Product.find();

    const host = req.get('host');
    const protocol = req.protocol;

    const parts = products.map(p => ({
      itemId: p._id.toString(),
      name: p.name,
      stock: p.quantity,
      category: p.category,
      price: p.price,
      isOutOfStock: Number(p.quantity) <= 0,
      stockStatus: Number(p.quantity) <= 0 ? 'Out of Stock' : 'In Stock',
      image: p.image ? `${protocol}://${host}/${p.image}` : null
    }));

    res.status(200).json(parts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingServiceRequests = async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ status: 'pending', mechanic: null })
      .populate('user')
      .sort({ createdAt: -1 });

    res.status(200).json(requests.map(serializeServiceRequest));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptServiceRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const mechanicId = req.user?.userId;

    if (!mechanicId) return res.status(400).json({ message: 'Mechanic id required' });

    const request = await ServiceRequest.findById(requestId).populate('user');
    if (!request) return res.status(404).json({ message: 'Service request not found' });
    if (request.status !== 'confirmed' || request.mechanic?.toString() !== mechanicId) {
      return res.status(400).json({ message: 'Service request is not available for acceptance.' });
    }

    request.mechanic = mechanicId;
    request.status = 'in-progress';
    request.startTime = req.body.startTime || request.startTime;
    await request.save();

    res.status(200).json({ message: 'Service request accepted', serviceRequest: serializeServiceRequest(request) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAvailableJobs = async (req, res) => {
  try {
    const jobs = await ServiceRequest.find({ status: 'confirmed', mechanic: req.user.userId })
      .populate('user')
      .sort({ createdAt: -1 });

    res.status(200).json(jobs.map(serializeServiceRequest));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMechanicJobsById = async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId || req.user?.userId;
    if (!mechanicId) return res.status(400).json({ message: 'Mechanic id required' });

    if (req.params.mechanicId && req.params.mechanicId !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await ServiceRequest.find({ mechanic: mechanicId }).populate('user').sort({ updatedAt: -1 });
    res.status(200).json(jobs.map(serializeServiceRequest));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMechanicStats = async (req, res) => {
  try {
    const mechanicId = req.params.mechanicId || req.user?.userId;
    if (!mechanicId) return res.status(400).json({ message: 'Mechanic id required' });

    if (req.params.mechanicId && req.params.mechanicId !== req.user?.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const jobs = await ServiceRequest.find({ mechanic: mechanicId });
    const totalJobs = jobs.length;
    const scheduledJobs = jobs.filter(job => job.status === 'pending').length;
    const inProgressJobs = jobs.filter(job => job.status === 'in-progress').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const totalEarnings = completedJobs * 1500;

    res.status(200).json({
      totalJobs,
      scheduledJobs,
      inProgressJobs,
      completedJobs,
      totalEarnings,
      paidJobs: completedJobs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptMechanicJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const mechanicId = req.user?.userId;

    const job = await ServiceRequest.findOne({ _id: jobId, mechanic: mechanicId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'confirmed') {
      return res.status(400).json({ message: 'Job is not available for acceptance.' });
    }

    job.status = 'accepted';
    await job.save();

    res.status(200).json({ message: 'Job accepted', job: serializeServiceRequest(job) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const startMechanicJob = async (req, res) => {
  try {
    const job = await ServiceRequest.findOne({ _id: req.params.jobId, mechanic: req.user.userId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'accepted') return res.status(400).json({ message: 'Only accepted jobs can be started.' });

    job.status = 'in-progress';
    await job.save();

    res.status(200).json({ message: 'Job started', job: serializeServiceRequest(job) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeMechanicJob = async (req, res) => {
  try {
    const job = await ServiceRequest.findOne({ _id: req.params.jobId, mechanic: req.user.userId });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.status !== 'in-progress') return res.status(400).json({ message: 'Only in-progress jobs can be completed.' });

    job.status = 'completed';
    await job.save();

    res.status(200).json({ message: 'Job completed', job: serializeServiceRequest(job) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPartsForMechanic,
  getPendingServiceRequests,
  acceptServiceRequest,
  getAvailableJobs,
  getMechanicJobsById,
  getMechanicStats,
  acceptMechanicJob,
  startMechanicJob,
  completeMechanicJob
};
