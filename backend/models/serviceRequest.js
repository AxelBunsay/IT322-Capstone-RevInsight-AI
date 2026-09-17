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
  estimatedPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'accepted', 'in-progress', 'completed', 'declined'],
    default: 'pending'
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    }
  }],
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
  scheduledDate: {
    type: Date,
    default: null
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
  if (this.isModified('status')) {
    const lastStatus = this.statusHistory[this.statusHistory.length - 1];
    if (!lastStatus || lastStatus.status !== this.status) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date(),
        note: `Status updated to ${this.status}`
      });
    }
  }

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
