const express = require('express');
const router = express.Router();
const { login, getAdmin } = require('../../controllers/adminControllers/adminController');
const mechanicController = require('../../controllers/mechanic');
const { protect } = require('../../middleware/adminAuth');
const reservations = require('../../controllers/reservationController');


// Public login route; administrator accounts are provisioned out of band.
router.post('/login', login);

// Protected routes
router.get('/admin', protect, getAdmin);
router.get('/reservations/settings', protect, reservations.getPublicSettings);
router.put('/reservations/settings', protect, reservations.updateSettings);
router.get('/reservations', protect, reservations.getAdminReservations);
router.post('/reservations/:id/confirm', protect, reservations.confirmReservation);
router.post('/reservations/:id/reject', protect, reservations.rejectReservation);
router.post('/reservations/:id/complete', protect, reservations.completeReservation);
router.post('/reservations/:id/cancel', protect, reservations.cancelAdminReservation);
router.post('/reservations/:id/refund-decision', protect, reservations.decideExpiredRefund);

// Admin: delete mechanic via admin API
router.delete('/mechanics/:id', protect, mechanicController.deleteMechanic);

// Admin: POST-based delete (fallback for environments where DELETE is not accepted)
router.post('/mechanics/delete', protect, async (req, res) => {
	try {
		const { id } = req.body;
		console.log('[admin delete fallback] id=', id, 'body=', req.body);
		if (!id) return res.status(400).json({ message: 'Mechanic id required' });
		const mech = await require('../../models/mechanic').findById(id);
		if (!mech) return res.status(404).json({ message: 'Mechanic not found' });
		await require('../../models/mechanic').findByIdAndDelete(id);
		console.log('[admin delete fallback] deleted id=', id);
		res.json({ message: 'Mechanic deleted successfully' });
	} catch (e) {
		console.error('[admin delete fallback] error', e);
		res.status(500).json({ message: e.message });
	}
});

module.exports = router;