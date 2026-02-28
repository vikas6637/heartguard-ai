const express = require('express');
const router = express.Router();
const {
  getUsage,
  createVideoCall,
  getVideoCalls,
  updateVideoCall,
  getRoomInfo,
} = require('../controllers/videoCallController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/usage', protect, getUsage);
router.post('/', protect, createVideoCall);
router.get('/', protect, getVideoCalls);
router.put('/:id', protect, updateVideoCall);
router.get('/:id/room', protect, getRoomInfo);

module.exports = router;
