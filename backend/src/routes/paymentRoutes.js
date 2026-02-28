const express = require('express');
const router = express.Router();
const {
  getPlans,
  createOrder,
  verifyPayment,
  getSubscription,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/plans', getPlans);
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/subscription', protect, getSubscription);

module.exports = router;
