const mongoose = require('mongoose');
const Service = require('../models/service');
const ServiceLaborRate = require('../models/serviceLaborRate');
const { validateServiceInput } = require('../utils/inventoryValidation');
const { archiveOrDeleteService } = require('../utils/safeDeleteInventoryRecord');

const validateServiceId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid service id' });
    return false;
  }

  return true;
};

const handleServiceError = (res, error) => {
  if (error.code === 11000) {
    return res.status(409).json({
      message: 'A service with that name already exists',
      fieldErrors: { name: 'A service with that name already exists.' }
    });
  }

  const status = error.name === 'ValidationError' || error.name === 'CastError'
    ? 400
    : 500;
  return res.status(status).json({ message: error.message });
};

const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.status(200).json({ services });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const getService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  try {
    const service = await Service.findOne({ _id: req.params.id, isActive: { $ne: false } });
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
    const fieldErrors = validateServiceInput(req.body);
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({
        message: 'Please correct the highlighted fields.',
        fieldErrors
      });
    }
    const service = await Service.create({
      name: req.body.name.trim(),
      description: req.body.description.trim(),
      price: Number(req.body.price),
      mechanicFee: Number(req.body.mechanicFee)
    });
    await ServiceLaborRate.updateOne(
      { serviceType: service.name },
      { $set: { laborFee: service.mechanicFee, isActive: true } },
      { upsert: true }
    );

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const updateService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  try {
    const existingService = await Service.findById(req.params.id);
    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    const fieldErrors = validateServiceInput(req.body, existingService || {});
    if (Object.keys(fieldErrors).length) {
      return res.status(400).json({
        message: 'Please correct the highlighted fields.',
        fieldErrors
      });
    }
    const service = existingService;
    service.name = (req.body.name ?? service.name).trim();
    service.description = (req.body.description ?? service.description).trim();
    service.price = Number(req.body.price ?? service.price);
    service.mechanicFee = Number(req.body.mechanicFee ?? service.mechanicFee);
    await service.save();
    if (existingService.name !== service.name) {
      await ServiceLaborRate.updateOne(
        { serviceType: existingService.name },
        { $set: { isActive: false } }
      );
    }
    await ServiceLaborRate.updateOne(
      { serviceType: service.name },
      { $set: { laborFee: service.mechanicFee, isActive: true } },
      { upsert: true }
    );
    res.status(200).json({ message: 'Service updated successfully', service });
  } catch (error) {
    handleServiceError(res, error);
  }
};

const deleteService = async (req, res) => {
  if (!validateServiceId(req.params.id, res)) return;

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const { archived } = await archiveOrDeleteService(service);
    res.status(200).json({
      archived,
      message: archived
        ? 'Service archived because it is referenced by past records'
        : 'Service deleted successfully'
    });
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