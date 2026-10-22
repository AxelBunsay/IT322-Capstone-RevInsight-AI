const mongoose = require('mongoose');

const serviceSlotLockSchema = new mongoose.Schema({
  dateKey: { type: String, required: true },
  startTime: { type: String, required: true },
  bookingVersion: { type: Number, required: true, default: 0 }
}, { timestamps: true });

serviceSlotLockSchema.index({ dateKey: 1, startTime: 1 }, { unique: true });

module.exports = mongoose.model('ServiceSlotLock', serviceSlotLockSchema);
