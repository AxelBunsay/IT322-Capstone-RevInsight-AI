const mongoose = require('mongoose');

const pendingUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      select: false
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    otp: {
      code: {
        type: String,
        required: true
      },
      expiresAt: {
        type: Date,
        required: true,
        expires: 0
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingUser', pendingUserSchema);