const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    minlength: 2,
    maxlength: 100,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: 0
  },
  mechanicFee: {
    type: Number,
    min: 0,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);