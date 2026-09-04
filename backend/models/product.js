const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    minlength: 3,
    maxlength: 100
  },
  
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: 0
  },
  
  quantity: {
    type: Number,
    required: [true, 'Product quantity is required'],
    min: 0
  },
  
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  
  image: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Product', productSchema);