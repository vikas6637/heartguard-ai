const express = require('express');
const router = express.Router();
const {
  getDoctors,
  createAppointment,
  getAppointments,
  updateAppointment,
  getBookedSlots,
} = require('../controllers/appointmentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/doctors', protect, getDoctors);
router.post('/', protect, createAppointment);
router.get('/', protect, getAppointments);
router.put('/:id', protect, updateAppointment);
router.get('/slots/:doctorId/:date', protect, getBookedSlots);

module.exports = router;
