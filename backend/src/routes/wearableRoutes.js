const express = require('express');
const router = express.Router();
const {
  syncWearableData,
  getSupportedDevices,
  getWearableStatus,
} = require('../controllers/wearableController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/supported', getSupportedDevices);
router.post('/sync', protect, syncWearableData);
router.get('/status', protect, getWearableStatus);

module.exports = router;
