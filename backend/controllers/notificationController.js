const Notification = require('../models/notification');

const getAdminNotifications = async (req, res) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ audience: 'admin' }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ audience: 'admin', read: false })
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[getAdminNotifications] error', error);
    res.status(500).json({ message: 'Notifications could not be loaded.' });
  }
};

const markAdminNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, audience: 'admin' },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (error) {
    console.error('[markAdminNotificationRead] error', error);
    res.status(500).json({ message: 'Notification could not be updated.' });
  }
};

const markAllAdminNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ audience: 'admin', read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    console.error('[markAllAdminNotificationsRead] error', error);
    res.status(500).json({ message: 'Notifications could not be updated.' });
  }
};

const getCustomerNotifications = async (req, res) => {
  try {
    const customerId = req.user.userId;
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ audience: 'customer', customerId }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ audience: 'customer', customerId, read: false })
    ]);
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('[getCustomerNotifications] error', error);
    res.status(500).json({ message: 'Notifications could not be loaded.' });
  }
};

const markCustomerNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, audience: 'customer', customerId: req.user.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json({ notification });
  } catch (error) {
    console.error('[markCustomerNotificationRead] error', error);
    res.status(500).json({ message: 'Notification could not be updated.' });
  }
};

module.exports = {
  getAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  getCustomerNotifications,
  markCustomerNotificationRead
};
