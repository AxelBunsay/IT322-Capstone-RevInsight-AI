const mongoose = require('mongoose');

const serviceLaborRateSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  laborFee: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  }
});

module.exports = mongoose.model('ServiceLaborRate', serviceLaborRateSchema);