const mongoose = require('mongoose');
const Service = require('../models/service');

const validateServiceId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid service id' });
    return false;
  }

  return true;
};

const handleServiceError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A service with that name already exists' });
  }

  const status = error.name === 'ValidationError' || error.name === 'CastError'
    ? 400
    : 500;
  return res.status(status).json({ message: error.message });
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.status(200).json({ services });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const getService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.status(200).json({ service });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const createService = async (req, res) => {
  try {
    const service = await Service.create({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      mechanicFee: req.body.mechanicFee
    });

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const updateService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  const updates = {};
  for (const field of ['name', 'description', 'price', 'mechanicFee']) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'At least one service field is required' });
  }

  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.status(200).json({ message: 'Service updated successfully', service });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const deleteService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    handleServiceError(res, error);
  }
};

module.exports = {
  getServices,
  getService,
  createService,
  updateService,
  deleteService
};