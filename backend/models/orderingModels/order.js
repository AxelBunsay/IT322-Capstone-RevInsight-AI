const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  
  customerPhone: {
    type: String,
    required: true
  },
  
  items: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      productName: String,
      price: Number,
      quantity: Number
    }
  ],
  
  totalPrice: {
    type: Number,
    required: true
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);