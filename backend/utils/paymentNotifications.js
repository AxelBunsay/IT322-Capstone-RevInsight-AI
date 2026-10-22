const Notification = require('../models/notification');

const money = (amount) => Number(amount || 0).toLocaleString('en-PH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

async function createPaymentNotifications({ customerId, recordId, recordType, code, customerName, amount, session }) {
  const notifications = await Notification.create([
    {
      audience: 'admin',
      type: 'payment_submitted',
      message: `New payment submitted: ${code} · ${customerName} · ₱${money(amount)}`,
      recordId,
      recordType
    },
    {
      audience: 'customer',
      customerId,
      type: 'payment_submitted',
      message: `Payment sent. The shop will check it shortly.`,
      recordId,
      recordType
    }
  ], { session });
  return notifications;
}

async function createPaymentDecisionNotification({ customerId, recordId, recordType, code, confirmed, reason, session }) {
  const message = confirmed
    ? `Your payment for ${code} was confirmed.`
    : `Your payment for ${code} was rejected: ${reason}. Please send a new receipt.`;
  const [notification] = await Notification.create([{
    audience: 'customer',
    customerId,
    type: confirmed ? 'payment_confirmed' : 'payment_rejected',
    message,
    recordId,
    recordType
  }], { session });
  return notification;
}

module.exports = { createPaymentNotifications, createPaymentDecisionNotification };
