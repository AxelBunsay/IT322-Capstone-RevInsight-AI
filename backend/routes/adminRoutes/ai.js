const express = require('express');
const router = express.Router();
const { askRevenueAI } = require('../../controllers/adminControllers/aiController');
const { protect } = require('../../middleware/adminAuth');

router.post('/revenue/ask-ai', protect, askRevenueAI);

module.exports = router;