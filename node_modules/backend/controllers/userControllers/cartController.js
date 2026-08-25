const Cart = require('../../models/orderingModels/cart');
const Product = require('../../models/product');
const User = require('../../models/user');

const getCustomerPhone = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (!user.phoneNumber) throw new Error('User phone number is required');
  return { phoneNumber: user.phoneNumber, customerName: `${user.firstName} ${user.lastName}` };
};

// Add to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const { phoneNumber, customerName } = await getCustomerPhone(req.user.userId);

    if (!productId || !Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and a positive whole-number quantity are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    let cart = await Cart.findOne({ customerPhone: phoneNumber });
    if (!cart) {
      cart = new Cart({
        customerName,
        customerPhone: phoneNumber,
        items: []
      });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    const requestedQuantity = (existingItem?.quantity || 0) + Number(quantity);
    if (product.quantity < requestedQuantity) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock for ${product.name}. Only ${product.quantity} available.`
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQuantity;
    } else {
      cart.items.push({
        productId,
        productName: product.name,
        price: product.price,
        quantity: Number(quantity),
        image: product.image
      });
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product added to cart',
      cart
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get cart
const getCart = async (req, res) => {
  try {
    const { phoneNumber } = await getCustomerPhone(req.user.userId);
    const cart = await Cart.findOne({ customerPhone: phoneNumber });

    if (!cart) {
      return res.status(200).json({
        success: true,
        cart: { items: [], totalPrice: 0 }
      });
    }

    res.status(200).json({
      success: true,
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Remove from cart
const removeFromCart = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { phoneNumber } = await getCustomerPhone(req.user.userId);
    const cart = await Cart.findOne({ customerPhone: phoneNumber });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from cart',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update cart quantity
const updateCartQuantity = async (req, res) => {
  try {
    const productId = req.params.productId;
    const { quantity } = req.body;
    const { phoneNumber } = await getCustomerPhone(req.user.userId);

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive whole number'
      });
    }

    const cart = await Cart.findOne({ customerPhone: phoneNumber });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Product not in cart'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product is no longer available'
      });
    }

    if (product.quantity < Number(quantity)) {
      return res.status(400).json({
        success: false,
        message: `Not enough stock for ${product.name}. Only ${product.quantity} available.`
      });
    }

    item.quantity = Number(quantity);
    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const { phoneNumber } = await getCustomerPhone(req.user.userId);
    await Cart.findOneAndDelete({ customerPhone: phoneNumber });

    res.status(200).json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  clearCart
};