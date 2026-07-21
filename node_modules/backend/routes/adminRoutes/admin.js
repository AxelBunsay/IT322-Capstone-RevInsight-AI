const express = require('express');
const router = express.Router();
const { signup, login, getAdmin } = require('../../controllers/adminControllers/adminController');
const mechanicController = require('../../controllers/mechanic');
const { protect } = require('../../middleware/adminAuth');


// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/admin', protect, getAdmin);

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