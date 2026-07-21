const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mechanic',
    default: null // Assigned later
  },
  serviceType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  startTime: {
    type: String, // e.g., '08:00', '14:30'
    default: null,
    validate: {
      validator: function(v) {
        // Only allow times between 08:00 and 17:00
        if (!v) return true;
        const [h, m] = v.split(':').map(Number);
        return (
          h >= 8 && h <= 17 && m >= 0 && m < 60 && (h < 17 || m === 0)
        );
      },
      message: 'Start time must be between 08:00 and 17:00.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

serviceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
