const mongoose = require('mongoose');

const serviceSlotSchema = new mongoose.Schema({
  serviceType: { type: String, required: true },
  dateKey: { type: String, required: true },
  startTime: { type: String, required: true },
  booked: { type: Number, required: true, default: 0, min: 0 },
  bookingVersion: { type: Number, required: true, default: 0 }
}, { timestamps: true });

serviceSlotSchema.index({ dateKey: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('ServiceSlot', serviceSlotSchema);
