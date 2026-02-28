const Appointment = require('../models/Appointment');
const User = require('../models/User');

// @desc    Get available doctors
// @route   GET /api/appointments/doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await User.find({ role: 'doctor' })
      .select('name email specialization avatar');
    res.json({ doctors });
  } catch (error) {
    next(error);
  }
};

// @desc    Create appointment (patient books → status = pending)
// @route   POST /api/appointments
exports.createAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, timeSlot, reason } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ error: 'Doctor, date, and time slot are required' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check for conflicting appointments
    const existing = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      status: { $nin: ['cancelled', 'rejected'] },
    });
    if (existing) {
      return res.status(409).json({ error: 'This time slot is already booked' });
    }

    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      timeSlot,
      reason: reason || '',
      status: 'pending', // Needs doctor approval
    });

    const populated = await appointment.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name email' },
    ]);

    res.status(201).json({ appointment: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my appointments (patient or doctor)
// @route   GET /api/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const query = req.user.role === 'doctor'
      ? { doctor: req.user.id }
      : { patient: req.user.id };

    const appointments = await Appointment.find(query)
      .populate('patient', 'name email')
      .populate('doctor', 'name specialization')
      .sort({ appointmentDate: -1 });

    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status (doctor: approve/reject/complete, patient: request-cancel/request-postpone)
// @route   PUT /api/appointments/:id
exports.updateAppointment = async (req, res, next) => {
  try {
    const { action, doctorNotes, newDate, newTimeSlot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const isPatient = appointment.patient.toString() === req.user.id;
    const isDoctor = appointment.doctor.toString() === req.user.id;
    if (!isPatient && !isDoctor) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // ── Doctor actions ──
    if (isDoctor) {
      switch (action) {
        case 'approve':
          if (appointment.status !== 'pending') {
            return res.status(400).json({ error: 'Can only approve pending appointments' });
          }
          appointment.status = 'approved';
          break;
        case 'reject':
          appointment.status = 'rejected';
          if (doctorNotes) appointment.doctorNotes = doctorNotes;
          break;
        case 'complete':
          appointment.status = 'completed';
          if (doctorNotes) appointment.doctorNotes = doctorNotes;
          break;
        case 'cancel':
          appointment.status = 'cancelled';
          if (doctorNotes) appointment.doctorNotes = doctorNotes;
          break;
        case 'reschedule':
          if (newDate) appointment.appointmentDate = new Date(newDate);
          if (newTimeSlot) appointment.timeSlot = newTimeSlot;
          appointment.status = 'rescheduled';
          break;
        default:
          return res.status(400).json({ error: 'Invalid action. Use: approve, reject, complete, cancel, reschedule' });
      }
    }

    // ── Patient actions ──
    if (isPatient) {
      switch (action) {
        case 'request-cancel':
          if (['cancelled', 'completed', 'rejected'].includes(appointment.status)) {
            return res.status(400).json({ error: 'Cannot request cancellation for this appointment' });
          }
          appointment.status = 'cancel-requested';
          break;
        case 'request-postpone':
          if (['cancelled', 'completed', 'rejected'].includes(appointment.status)) {
            return res.status(400).json({ error: 'Cannot request postponement for this appointment' });
          }
          appointment.status = 'postpone-requested';
          if (newDate) appointment.requestedNewDate = newDate;
          if (newTimeSlot) appointment.requestedNewTimeSlot = newTimeSlot;
          break;
        default:
          return res.status(400).json({ error: 'Invalid action. Patients can use: request-cancel, request-postpone' });
      }
    }

    await appointment.save();

    const populated = await appointment.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name email' },
    ]);

    res.json({ appointment: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked slots for a doctor on a date
// @route   GET /api/appointments/slots/:doctorId/:date
exports.getBookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.params;
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'rejected'] },
    }).select('timeSlot');

    res.json({ bookedSlots: booked.map(a => a.timeSlot) });
  } catch (error) {
    next(error);
  }
};
