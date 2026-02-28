const express = require('express');
const router = express.Router();
const { sendMessage, getAdvice } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/message', protect, sendMessage);
router.post('/advice', protect, getAdvice);

module.exports = router;
