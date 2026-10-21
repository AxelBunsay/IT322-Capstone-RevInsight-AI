const Order = require('../../models/orderingModels/order');
const Cart = require('../../models/orderingModels/cart');
const Product = require('../../models/product');
const User = require('../../models/user');
const Reservation = require('../../models/orderingModels/reservation');
const { expireReservations } = require('../reservationController');

const getCustomerPhone = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');
  if (!user.phoneNumber) throw new Error('User phone number is required');
  return { phoneNumber: user.phoneNumber, customerName: `${user.firstName} ${user.lastName}` };
};

// Checkout - validate cart and return info for payment
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
      const product = await Product.findOne({ _id: item.productId, isActive: { $ne: false } });
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `${item.productName || 'An item'} is no longer available`
        });
      }

      const availableQuantity = Math.max(0, product.quantity - Number(product.reservedQty || 0));
      if (availableQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Only ${availableQuantity} available.`
        });
      }
    }

    res.json({
      success: true,
      cart: {
        items: cart.items,
        totalPrice: cart.totalPrice,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Reorder a past order into the cart
const reorderOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let order = await Order.findOne({ _id: req.params.orderId, customerPhone: user.phoneNumber, code: { $exists: false } });
    if (!order) {
      const reservation = await Reservation.findOne({ _id: req.params.orderId, customerId: user._id, code: { $exists: true } });
      if (reservation) {
        order = {
          items: reservation.items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            price: item.unitPrice,
            quantity: item.qty
          }))
        };
      }
    }
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    let cart = await Cart.findOne({ customerPhone: user.phoneNumber });
    if (!cart) {
      cart = new Cart({
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhone: user.phoneNumber,
        items: []
      });
    }

    const warnings = [];
    for (const orderItem of order.items) {
      const product = await Product.findOne({ _id: orderItem.productId, isActive: { $ne: false } });
      if (!product) {
        warnings.push(`${orderItem.productName} is no longer available and was skipped.`);
        continue;
      }

      const availableQuantity = Math.max(0, product.quantity - Number(product.reservedQty || 0));
      if (availableQuantity === 0) {
        warnings.push(`${product.name} is out of stock and was skipped.`);
        continue;
      }

      const quantity = Math.min(orderItem.quantity, availableQuantity);
      const existingItem = cart.items.find(item => item.productId.toString() === orderItem.productId.toString());
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = product.price;
      } else {
        cart.items.push({
          productId: orderItem.productId,
          productName: product.name,
          category: product.category,
          price: product.price,
          quantity,
          image: product.image
        });
      }

      if (quantity < orderItem.quantity) {
        warnings.push(`${product.name} quantity reduced to ${quantity} due to available stock.`);
      }
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No items could be added to your cart. Check stock and try again.',
        warnings
      });
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Order items added to cart',
      cart,
      warnings
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get customer orders
const getCustomerOrders = async (req, res) => {
  try {
    await expireReservations();
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [orders, reservations] = await Promise.all([
      Order.find({ customerPhone: user.phoneNumber, code: { $exists: false } }).sort({ createdAt: -1 }),
      Reservation.find({ customerId: user._id, code: { $exists: true } }).sort({ createdAt: -1 })
    ]);
    const reservationOrders = reservations.map((reservation) => ({
      _id: reservation._id,
      code: reservation.code,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      items: reservation.items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        price: item.unitPrice,
        quantity: item.qty
      })),
      totalPrice: reservation.total,
      status: reservation.status,
      createdAt: reservation.createdAt,
      reservation
    }));
    const allOrders = [...orders, ...reservationOrders].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
    res.status(200).json({ success: true, count: allOrders.length, orders: allOrders, reservations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkout,
  reorderOrder,
  getCustomerOrders
};