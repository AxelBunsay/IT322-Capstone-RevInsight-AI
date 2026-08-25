const Stripe = require('stripe');
const Order = require('../models/orderingModels/order');
const Cart = require('../models/orderingModels/cart');
const Product = require('../models/product');
const User = require('../models/user');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
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
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `${item.productName || 'An item'} is no longer available`
        });
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`
        });
      }
    }

    const amount = Math.round(cart.totalPrice * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'php',
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user._id.toString(),
        customerPhone: user.phoneNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        cartItems: JSON.stringify(cart.items.map(item => ({
          productId: item.productId.toString(),
          productName: item.productName,
          price: item.price,
          quantity: item.quantity
        })))
      }
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: cart.totalPrice
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ success: false, message: 'Payment intent ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Payment not completed' });
    }

    const userId = paymentIntent.metadata.userId;
    const customerPhone = paymentIntent.metadata.customerPhone;
    const customerName = paymentIntent.metadata.customerName;
    const cartItems = JSON.parse(paymentIntent.metadata.cartItems || '[]');

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        console.error(`Product ${item.productId} not found during order creation`);
        continue;
      }
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}`
        });
      }
    }

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    const order = new Order({
      customerName,
      customerPhone,
      items: cartItems,
      totalPrice: paymentIntent.amount / 100,
      status: 'completed'
    });

    await order.save();

    user.totalPurchases += 1;
    user.totalSpent += paymentIntent.amount / 100;
    if (!user.firstPurchaseDate) {
      user.firstPurchaseDate = Date.now();
    }
    user.lastPurchaseDate = Date.now();
    user.lastReceiptDate = Date.now();
    await user.save();

    await Cart.findOneAndDelete({ customerPhone });

    res.json({
      success: true,
      message: 'Payment confirmed and order created',
      order
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log('Payment succeeded:', paymentIntent.id);
  }

  res.json({ received: true });
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook
};