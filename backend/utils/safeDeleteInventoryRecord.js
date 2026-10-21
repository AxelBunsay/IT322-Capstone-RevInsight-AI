const BusinessRecord = require('../models/businessRecord');
const Cart = require('../models/orderingModels/cart');
const Order = require('../models/orderingModels/order');
const Product = require('../models/product');
const ServiceRequest = require('../models/serviceRequest');
const Service = require('../models/service');
const ServiceLaborRate = require('../models/serviceLaborRate');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deactivateServiceLaborRate = async (service) => {
  const serviceTypePattern = new RegExp(`^\\s*${escapeRegex(service.name)}\\s*$`, 'i');
  const rate = await ServiceLaborRate.findOne({ serviceType: serviceTypePattern });
  if (rate) {
    rate.isActive = false;
    await rate.save();
    return;
  }

  await ServiceLaborRate.create({
    serviceType: service.name,
    laborFee: service.mechanicFee,
    isActive: false
  });
};

const archiveOrDeleteProduct = async (product) => {
  const itemNamePattern = new RegExp(`(^|,\\s*)${escapeRegex(product.name)}(\\s*,|$)`, 'i');
  const [order, cart, businessRecord] = await Promise.all([
    Order.exists({
      $or: [
        { 'items.productId': product._id },
        { 'items.productName': product.name }
      ]
    }),
    Cart.exists({ 'items.productId': product._id }),
    BusinessRecord.exists({
      recordType: 'product',
      $or: [
        { sourceId: product._id },
        { itemName: itemNamePattern }
      ]
    })
  ]);

  if (order || cart || businessRecord) {
    product.isActive = false;
    await product.save();
    return { archived: true };
  }

  await Product.deleteOne({ _id: product._id });
  return { archived: false };
};

const archiveOrDeleteService = async (service) => {
  const [serviceRequest, businessRecord] = await Promise.all([
    ServiceRequest.exists({ serviceType: new RegExp(`^\\s*${escapeRegex(service.name)}\\s*$`, 'i') }),
    BusinessRecord.exists({
      recordType: 'service',
      $or: [
        { sourceId: service._id },
        { itemName: new RegExp(`^\\s*${escapeRegex(service.name)}\\s*$`, 'i') }
      ]
    })
  ]);

  if (serviceRequest || businessRecord) {
    service.isActive = false;
    await service.save();
    await deactivateServiceLaborRate(service);
    return { archived: true };
  }

  await deactivateServiceLaborRate(service);
  await Service.deleteOne({ _id: service._id });
  return { archived: false };
};

module.exports = { archiveOrDeleteProduct, archiveOrDeleteService };
