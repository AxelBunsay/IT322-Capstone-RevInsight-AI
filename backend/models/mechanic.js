const mongoose = require('mongoose');

const mechanicSchema = new mongoose.Schema({
  // Authentication & Identity
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false // Don't return password by default
  },

  // Personal Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required']
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['mechanic'],
    default: 'mechanic'
  },

  // Mechanic-specific Information
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: ['general', 'engine', 'transmission', 'electrical', 'suspension', 'brakes']
  },
  yearsOfExperience: {
    type: Number,
    required: [true, 'Years of experience is required'],
    min: 0
  },
  certifications: [String],

  // Profile Information
  photoUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'on-leave'],
    default: 'available'
  },

  // Work Statistics
  totalRepairs: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  successRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // Admin Assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, { timestamps: true });

// Index for faster queries
mechanicSchema.index({ specialization: 1 });

const Mechanic = mongoose.model('Mechanic', mechanicSchema);

module.exports = Mechanic;
