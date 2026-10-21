const mongoose = require('mongoose');

const reservationSettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: 'reservation' },
  downPaymentPercent: { type: Number, default: 30, min: 1, max: 100 },
  pendingPaymentHours: { type: Number, default: 24, min: 1, max: 720 },
  holdDays: { type: Number, default: 3, min: 1, max: 30 },
  paymentInstructions: {
    methodName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' }
  },
  pickupAddress: { type: String, default: '' },
  pickupHours: { type: String, default: '' }
});

reservationSettingsSchema.statics.getDefaults = function getDefaults() {
  return this.findOneAndUpdate(
    { key: 'reservation' },
    { $setOnInsert: { key: 'reservation', downPaymentPercent: 30, pendingPaymentHours: 24, holdDays: 3 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

module.exports = mongoose.model('ReservationSettings', reservationSettingsSchema);
