const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const createPaymentIntent = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Immediate item payments are no longer available. Create a reservation and submit its down payment instead.'
  });
};

const confirmPayment = async (req, res) => {
  res.status(410).json({
    success: false,
    message: 'Immediate item payments are no longer available. Submit payment through the reservation page.'
  });
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