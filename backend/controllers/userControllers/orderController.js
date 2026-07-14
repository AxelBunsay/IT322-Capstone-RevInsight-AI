const Order = require('../../models/orderingModels/order');
const Cart = require('../../models/orderingModels/cart');
const Product = require('../../models/product');
const User = require('../../models/user');

// Checkout (create order)
const checkout = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const cart = await Cart.findOne({ customerPhone: user.phoneNumber });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (product.quantity < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for ${product.name}`
          });
        }
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    const order = new Order({
      customerName: `${user.firstName} ${user.lastName}`,
      customerPhone: user.phoneNumber,
      items: cart.items,
      totalPrice: cart.totalPrice,
      status: 'completed'
    });

    await order.save();

    user.totalPurchases += 1;
    user.totalSpent += cart.totalPrice;
    if (!user.firstPurchaseDate) {
      user.firstPurchaseDate = Date.now();
    }
    user.lastPurchaseDate = Date.now();
    user.lastReceiptDate = Date.now();
    await user.save();

    await Cart.findOneAndDelete({ customerPhone: user.phoneNumber });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get customer orders
const getCustomerOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const orders = await Order.find({ customerPhone: user.phoneNumber }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkout,
  getCustomerOrders
};