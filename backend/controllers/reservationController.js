const mongoose = require('mongoose');
const Product = require('../models/product');
const User = require('../models/user');
const Reservation = require('../models/orderingModels/reservation');
const Counter = require('../models/orderingModels/counter');
const ReservationSettings = require('../models/reservationSettings');
const BusinessRecord = require('../models/businessRecord');
const Cart = require('../models/orderingModels/cart');
const cloudinary = require('../config/cloudinary');

const validStatuses = ['Pending Down Payment', 'Payment Submitted', 'Reserved', 'Completed', 'Cancelled', 'Expired'];
const money = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sendError = (res, error, fallback = 'Reservation request failed.') => {
  console.error('[reservations] error', error);
  res.status(error.status || 500).json({ success: false, message: error.message || fallback });
};

const getSettings = async () => ReservationSettings.getDefaults();

const validateStatus = (status) => !status || validStatuses.includes(status);
const isValidReservationId = (id) => mongoose.Types.ObjectId.isValid(id);

const uploadPaymentProof = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'revinsight/reservation-proofs', resource_type: 'image' },
    (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    }
  );
  stream.end(file.buffer);
});

async function releaseReservedStock(reservation, session) {
  for (const item of reservation.items) {
    const product = await Product.findById(item.productId).session(session);
    if (!product || Number(product.reservedQty || 0) < item.qty) {
      throw Object.assign(new Error(`Unable to release reserved stock for ${item.name}. Contact support.`), { status: 409 });
    }
    product.reservedQty = Number(product.reservedQty || 0) - item.qty;
    await product.save({ session });
  }
}

async function expireReservations() {
  const settings = await getSettings();
  const now = new Date();
  let expiredCandidates;
  do {
    expiredCandidates = await Reservation.find({
      code: { $exists: true },
      $or: [
        {
          status: 'Pending Down Payment',
          $or: [
            { paymentDueAt: { $lte: now } },
            { paymentDueAt: null, createdAt: { $lte: new Date(now.getTime() - settings.pendingPaymentHours * 60 * 60 * 1000) } }
          ]
        },
        { status: 'Reserved', reservedUntil: { $lte: now } }
      ]
    }).select('_id').limit(500);

    for (const candidate of expiredCandidates) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const reservation = await Reservation.findOne({ _id: candidate._id, code: { $exists: true } }).session(session);
          if (!reservation) return;
          if (reservation.status === 'Pending Down Payment' && (reservation.paymentDueAt ? reservation.paymentDueAt <= now : reservation.createdAt <= new Date(now.getTime() - settings.pendingPaymentHours * 60 * 60 * 1000))) {
            reservation.status = 'Expired';
            reservation.expiredAt = now;
            reservation.cancelReason = 'The down payment deadline passed.';
            await reservation.save({ session });
          } else if (reservation.status === 'Reserved' && reservation.reservedUntil <= now) {
            await releaseReservedStock(reservation, session);
            reservation.status = 'Expired';
            reservation.expiredAt = now;
            reservation.cancelReason = 'The pickup hold period ended.';
            await reservation.save({ session });
          }
        });
      } finally {
        await session.endSession();
      }
    }
  } while (expiredCandidates.length === 500);
}

const createReservation = async (req, res) => {
  try {
    const requestedItems = req.body?.items;
    if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 50) {
      return res.status(400).json({ success: false, message: 'Add between 1 and 50 items to the reservation.' });
    }

    const itemIds = new Set();
    for (const item of requestedItems) {
      if (!item || typeof item !== 'object') {
        return res.status(400).json({ success: false, message: 'Each reservation item must be an object with a product ID and quantity.' });
      }
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ success: false, message: 'Each item must have a valid product ID.' });
      }
      if (itemIds.has(String(item.productId))) {
        return res.status(400).json({ success: false, message: 'Remove duplicate products before creating a reservation.' });
      }
      itemIds.add(String(item.productId));
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99999) {
        return res.status(400).json({ success: false, message: 'Item quantities must be whole numbers from 1 to 99,999.' });
      }
    }

    const [user, settings] = await Promise.all([
      User.findById(req.user.userId),
      getSettings()
    ]);
    if (!user) return res.status(404).json({ success: false, message: 'Customer account not found.' });

    const items = [];
    for (const requested of requestedItems) {
      const product = await Product.findOne({ _id: requested.productId, isActive: { $ne: false } });
      if (!product) return res.status(404).json({ success: false, message: 'A selected product is no longer available.' });
      const available = Math.max(0, product.quantity - Number(product.reservedQty || 0));
      if (available < requested.qty) {
        return res.status(409).json({ success: false, message: `Only ${available} of ${product.name} are currently available.` });
      }
      const unitPrice = money(product.price);
      items.push({ productId: product._id, name: product.name, unitPrice, qty: requested.qty, lineTotal: money(unitPrice * requested.qty) });
    }

    const total = money(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const downPaymentPercent = settings.downPaymentPercent;
    const downPaymentAmount = money(total * downPaymentPercent / 100);
    const session = await mongoose.startSession();
    let reservation;
    try {
      await session.withTransaction(async () => {
        const counter = await Counter.findOneAndUpdate(
          { _id: 'reservation' },
          { $inc: { sequence: 1 } },
          { new: true, upsert: true, session }
        );
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email;
        [reservation] = await Reservation.create([{
          code: `RSV-${String(counter.sequence).padStart(4, '0')}`,
          customerId: user._id,
          customerName: name,
          customerPhone: user.phoneNumber || '',
          items,
          status: 'Pending Down Payment',
          total,
          downPaymentPercent,
          downPaymentAmount,
          amountPaid: 0,
          balanceDue: total,
          paymentDueAt: new Date(Date.now() + settings.pendingPaymentHours * 60 * 60 * 1000)
        }], { session });
      });
    } finally {
      await session.endSession();
    }
    res.status(201).json({ success: true, reservation });
  } catch (error) {
    sendError(res, error);
  }
};

const createReservationFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Customer account not found.' });
    const cart = await Cart.findOne({ customerPhone: user.phoneNumber });
    if (!cart || !cart.items.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

    const captured = {
      statusCode: 200,
      payload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return payload;
      }
    };
    await createReservation({
      user: req.user,
      body: { items: cart.items.map((item) => ({ productId: item.productId, qty: item.quantity })) }
    }, captured);
    if (captured.statusCode >= 400) return res.status(captured.statusCode).json(captured.payload);
    try {
      await Cart.deleteOne({ _id: cart._id });
    } catch (error) {
      console.error('[createReservationFromCart] cart cleanup failed', error);
      return res.status(201).json({
        ...captured.payload,
        message: 'Reservation created, but your cart could not be cleared. Remove the reserved items from your cart.'
      });
    }
    res.status(captured.statusCode).json(captured.payload);
  } catch (error) {
    sendError(res, error);
  }
};

const submitPayment = async (req, res) => {
  try {
    if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    const { reference } = req.body || {};
    if (typeof reference !== 'string' || reference.trim().length < 3 || reference.trim().length > 120) {
      return res.status(400).json({ success: false, message: 'Enter a reference number between 3 and 120 characters.' });
    }
    await expireReservations();
    const reservation = await Reservation.findOne({ _id: req.params.id, customerId: req.user.userId, code: { $exists: true } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    if (reservation.status !== 'Pending Down Payment') {
      return res.status(409).json({ success: false, message: 'Payment can only be submitted for a pending down payment.' });
    }
    const settings = await getSettings();
    if (!settings.paymentInstructions.methodName || !settings.paymentInstructions.accountName || !settings.paymentInstructions.accountNumber) {
      return res.status(409).json({ success: false, message: 'The shop payment instructions are not configured yet. Please contact the shop before submitting payment.' });
    }
    if (req.file && !['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
      return res.status(400).json({ success: false, message: 'Upload a JPG or PNG image as payment proof.' });
    }
    const paymentProofUrl = req.file ? await uploadPaymentProof(req.file) : '';
    reservation.paymentReference = reference.trim();
    reservation.paymentMethod = settings.paymentInstructions.methodName;
    reservation.paymentProofUrl = paymentProofUrl;
    reservation.submittedAt = new Date();
    reservation.status = 'Payment Submitted';
    reservation.rejectionReason = '';
    await reservation.save();
    res.json({ success: true, reservation });
  } catch (error) {
    sendError(res, error);
  }
};

const getCustomerReservations = async (req, res) => {
  try {
    await expireReservations();
    const reservations = await Reservation.find({ customerId: req.user.userId, code: { $exists: true } }).sort({ createdAt: -1 });
    res.json({ success: true, reservations });
  } catch (error) {
    sendError(res, error);
  }
};

const getCustomerReservation = async (req, res) => {
  try {
    if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    await expireReservations();
    const reservation = await Reservation.findOne({ _id: req.params.id, customerId: req.user.userId, code: { $exists: true } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    res.json({ success: true, reservation });
  } catch (error) {
    sendError(res, error);
  }
};

const cancelCustomerReservation = async (req, res) => {
  try {
    if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    const reason = req.body?.reason ?? 'Cancelled by customer';
    if (typeof reason !== 'string' || reason.length > 300) return res.status(400).json({ success: false, message: 'Cancellation reason must be 300 characters or fewer.' });
    await expireReservations();
    const reservation = await Reservation.findOne({ _id: req.params.id, customerId: req.user.userId, code: { $exists: true } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    if (!['Pending Down Payment', 'Payment Submitted'].includes(reservation.status)) {
      return res.status(409).json({ success: false, message: 'Customers can only cancel before the reservation is confirmed.' });
    }
    reservation.status = 'Cancelled';
    reservation.cancelledAt = new Date();
    reservation.cancelReason = reason.trim() || 'Cancelled by customer';
    await reservation.save();
    res.json({ success: true, reservation });
  } catch (error) {
    sendError(res, error);
  }
};

const getAdminReservations = async (req, res) => {
  try {
    await expireReservations();
    const { status, search = '' } = req.query;
    if (!validateStatus(status)) return res.status(400).json({ success: false, message: 'Invalid reservation status.' });
    if (typeof search !== 'string') return res.status(400).json({ success: false, message: 'Search must be text.' });
    const query = { code: { $exists: true }, ...(status ? { status } : {}) };
    if (search.trim()) {
      const pattern = new RegExp(escapeRegex(search.trim()), 'i');
      const matchingUsers = await User.find({
        $or: [{ firstName: pattern }, { lastName: pattern }, { email: pattern }, { phoneNumber: pattern }]
      }).select('_id');
      query.$or = [
        { code: pattern },
        { paymentReference: pattern },
        { customerName: pattern },
        { customerPhone: pattern },
        { customerId: { $in: matchingUsers.map((user) => user._id) } }
      ];
    }
    const reservations = await Reservation.find(query)
      .populate('customerId', 'firstName lastName email phoneNumber')
      .populate('verifiedBy', 'username')
      .populate('refundDecisionBy', 'username')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ success: true, reservations });
  } catch (error) {
    sendError(res, error);
  }
};

const confirmReservation = async (req, res) => {
  if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
  const session = await mongoose.startSession();
  try {
    await expireReservations();
    let result;
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne({ _id: req.params.id, code: { $exists: true } }).session(session);
      if (!reservation) throw Object.assign(new Error('Reservation not found.'), { status: 404 });
      if (reservation.status !== 'Payment Submitted') {
        throw Object.assign(new Error('Only submitted payments can be confirmed.'), { status: 409 });
      }
      for (const item of reservation.items) {
        const product = await Product.findOne({ _id: item.productId, isActive: { $ne: false } }).session(session);
        if (!product || product.quantity - Number(product.reservedQty || 0) < item.qty) {
          throw Object.assign(new Error(`Not enough available stock for ${item.name}. Cancel this reservation and refund the payment.`), { status: 409 });
        }
        product.reservedQty = Number(product.reservedQty || 0) + item.qty;
        await product.save({ session });
      }
      const settings = await getSettings();
      reservation.status = 'Reserved';
      reservation.amountPaid = reservation.downPaymentAmount;
      reservation.balanceDue = money(reservation.total - reservation.amountPaid);
      reservation.verifiedAt = new Date();
      reservation.verifiedBy = req.admin.id;
      reservation.reservedUntil = new Date(Date.now() + settings.holdDays * 24 * 60 * 60 * 1000);
      result = await reservation.save({ session });
    });
    res.json({ success: true, reservation: result });
  } catch (error) {
    sendError(res, error);
  } finally {
    await session.endSession();
  }
};

const rejectReservation = async (req, res) => {
  try {
    if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 3 || reason.length > 300) {
      return res.status(400).json({ success: false, message: 'Provide a rejection reason between 3 and 300 characters.' });
    }
    const reservation = await Reservation.findOne({ _id: req.params.id, code: { $exists: true } });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    if (reservation.status !== 'Payment Submitted') {
      return res.status(409).json({ success: false, message: 'Only submitted payments can be rejected.' });
    }
    reservation.status = 'Pending Down Payment';
    reservation.rejectionReason = reason;
    const settings = await getSettings();
    reservation.paymentDueAt = new Date(Date.now() + settings.pendingPaymentHours * 60 * 60 * 1000);
    reservation.paymentReference = '';
    reservation.paymentMethod = '';
    reservation.paymentProofUrl = '';
    reservation.submittedAt = null;
    await reservation.save();
    res.json({ success: true, reservation });
  } catch (error) {
    sendError(res, error);
  }
};

const completeReservation = async (req, res) => {
  if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
  const session = await mongoose.startSession();
  try {
    await expireReservations();
    let result;
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne({ _id: req.params.id, code: { $exists: true } }).session(session);
      if (!reservation) throw Object.assign(new Error('Reservation not found.'), { status: 404 });
      if (reservation.status !== 'Reserved') throw Object.assign(new Error('Only reserved items can be completed.'), { status: 409 });
      for (const item of reservation.items) {
        const product = await Product.findById(item.productId).session(session);
        if (!product || Number(product.reservedQty || 0) < item.qty || product.quantity < item.qty) {
          throw Object.assign(new Error(`Stock for ${item.name} is inconsistent. Resolve inventory before completing pickup.`), { status: 409 });
        }
        product.quantity -= item.qty;
        product.reservedQty = Number(product.reservedQty || 0) - item.qty;
        await product.save({ session });
      }
      reservation.status = 'Completed';
      reservation.amountPaid = reservation.total;
      reservation.balanceDue = 0;
      reservation.completedAt = new Date();
      result = await reservation.save({ session });
      await BusinessRecord.findOneAndUpdate(
        { recordType: 'product', sourceId: reservation._id },
        {
          recordType: 'product',
          sourceId: reservation._id,
          customer: reservation.customerName,
          customerPhone: reservation.customerPhone,
          itemName: reservation.items.map((item) => item.name).join(', '),
          category: 'Product Sales',
          amount: reservation.total,
          status: 'completed',
          completedAt: reservation.completedAt,
          notes: `${reservation.items.length} reserved product item${reservation.items.length === 1 ? '' : 's'} collected`
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, session }
      );
    });
    res.json({ success: true, reservation: result });
  } catch (error) {
    sendError(res, error);
  } finally {
    await session.endSession();
  }
};

async function cancelReservation(req, res, isRefundDecisionOnly = false) {
  if (!isValidReservationId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid reservation ID.' });
  let session;
  try {
    let result;
    const { refundDecision, reason } = req.body || {};
    if (refundDecision !== undefined && !['refunded', 'forfeited'].includes(refundDecision)) {
      return res.status(400).json({ success: false, message: 'Refund decision must be refunded or forfeited.' });
    }
    if (isRefundDecisionOnly && refundDecision === undefined) {
      return res.status(400).json({ success: false, message: 'Choose refunded or forfeited.' });
    }
    if (!isRefundDecisionOnly && (typeof reason !== 'string' || reason.trim().length < 3 || reason.trim().length > 300)) {
      return res.status(400).json({ success: false, message: 'Reason must be between 3 and 300 characters.' });
    }
    await expireReservations();
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const reservation = await Reservation.findOne({ _id: req.params.id, code: { $exists: true } }).session(session);
      if (!reservation) throw Object.assign(new Error('Reservation not found.'), { status: 404 });
      if (isRefundDecisionOnly) {
        if (reservation.status !== 'Expired' || reservation.amountPaid <= 0 || reservation.refundDecision) {
          throw Object.assign(new Error('A refund decision is only required for expired reservations with a confirmed down payment.'), { status: 409 });
        }
      } else {
        if (reservation.status === 'Completed' || reservation.status === 'Cancelled') {
          throw Object.assign(new Error('This reservation can no longer be cancelled.'), { status: 409 });
        }
        if ((reservation.status === 'Reserved' || reservation.status === 'Expired' && reservation.amountPaid > 0) && !refundDecision && !reservation.refundDecision) {
          throw Object.assign(new Error('Choose whether the confirmed down payment is refunded or forfeited.'), { status: 400 });
        }
        if (reservation.amountPaid <= 0 && refundDecision) {
          throw Object.assign(new Error('Refund decisions only apply after a down payment has been confirmed.'), { status: 400 });
        }
      }
      if (reservation.status === 'Reserved') await releaseReservedStock(reservation, session);
      if (!isRefundDecisionOnly) {
        reservation.status = 'Cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelReason = reason.trim();
      }
      if (refundDecision) {
        reservation.refundDecision = refundDecision;
        reservation.refundDecisionBy = req.admin.id;
        reservation.refundDecisionAt = new Date();
      }
      result = await reservation.save({ session });
    });
    res.json({ success: true, reservation: result });
  } catch (error) {
    sendError(res, error);
  } finally {
    if (session) await session.endSession();
  }
}

const cancelAdminReservation = (req, res) => cancelReservation(req, res);
const decideExpiredRefund = (req, res) => cancelReservation(req, res, true);

const getPublicSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      settings: {
        downPaymentPercent: settings.downPaymentPercent,
        pendingPaymentHours: settings.pendingPaymentHours,
        holdDays: settings.holdDays,
        paymentInstructions: settings.paymentInstructions,
        pickupAddress: settings.pickupAddress,
        pickupHours: settings.pickupHours
      }
    });
  } catch (error) {
    sendError(res, error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const { downPaymentPercent, pendingPaymentHours, holdDays, paymentInstructions, pickupAddress, pickupHours } = req.body || {};
    const errors = [];
    if (!Number.isInteger(downPaymentPercent) || downPaymentPercent < 10 || downPaymentPercent > 100) errors.push('Down payment percent must be a whole number from 10 to 100.');
    if (!Number.isInteger(pendingPaymentHours) || pendingPaymentHours < 1 || pendingPaymentHours > 720) errors.push('Pending payment hours must be a whole number from 1 to 720.');
    if (!Number.isInteger(holdDays) || holdDays < 1 || holdDays > 30) errors.push('Hold days must be a whole number from 1 to 30.');
    if (!paymentInstructions || typeof paymentInstructions !== 'object') errors.push('Payment instructions are required.');
    else {
      for (const field of ['methodName', 'accountName', 'accountNumber']) {
        if (typeof paymentInstructions[field] !== 'string' || paymentInstructions[field].length > 120) errors.push(`Payment ${field} must be 120 characters or fewer.`);
      }
    }
    if (typeof pickupAddress !== 'string' || pickupAddress.length > 500) errors.push('Pickup address must be 500 characters or fewer.');
    if (typeof pickupHours !== 'string' || pickupHours.length > 200) errors.push('Pickup hours must be 200 characters or fewer.');
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(' ') });

    const settings = await ReservationSettings.findOneAndUpdate(
      { key: 'reservation' },
      { $set: { downPaymentPercent, pendingPaymentHours, holdDays, paymentInstructions, pickupAddress, pickupHours } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, settings });
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  createReservation,
  createReservationFromCart,
  submitPayment,
  getCustomerReservations,
  getCustomerReservation,
  cancelCustomerReservation,
  getAdminReservations,
  confirmReservation,
  rejectReservation,
  completeReservation,
  cancelAdminReservation,
  decideExpiredRefund,
  getPublicSettings,
  updateSettings,
  expireReservations
};
