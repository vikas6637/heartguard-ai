const VideoCall = require('../models/VideoCall');
const User = require('../models/User');

// ── Tier limits per week ──
const WEEKLY_LIMITS = { free: 1, premium: 4, pro: 999 };

// Helper: count calls this week for a patient
async function getWeeklyCallCount(patientId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  return VideoCall.countDocuments({
    patient: patientId,
    createdAt: { $gte: weekStart },
    status: { $nin: ['cancelled', 'rejected'] },
  });
}


// @desc    Get weekly call usage info
// @route   GET /api/video-calls/usage
exports.getUsage = async (req, res, next) => {
  try {
    const used = await getWeeklyCallCount(req.user.id);
    const tier = req.user.subscriptionTier || 'free';
    const limit = WEEKLY_LIMITS[tier] || 1;
    res.json({ used, limit, tier, remaining: Math.max(0, limit - used) });
  } catch (error) { next(error); }
};


// @desc    Request a video call (patient → doctor)
// @route   POST /api/video-calls
exports.createVideoCall = async (req, res, next) => {
  try {
    if (req.user.role === 'doctor') {
      return res.status(403).json({ error: 'Only patients can request video calls' });
    }

    const { doctorId, scheduledAt, timeSlot, reason, callType, isEmergency } = req.body;
    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ error: 'Doctor and scheduled date/time are required' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // ── Check tier limit ──
    const tier = req.user.subscriptionTier || 'free';
    const limit = WEEKLY_LIMITS[tier] || 1;
    const used = await getWeeklyCallCount(req.user.id);

    // Emergency calls bypass limit check but still count
    if (!isEmergency && used >= limit) {
      return res.status(429).json({
        error: `Weekly video call limit reached (${limit} for ${tier} plan). Upgrade your plan for more calls.`,
        used, limit, tier,
      });
    }

    const call = await VideoCall.create({
      patient: req.user.id,
      doctor: doctorId,
      scheduledAt: new Date(scheduledAt),
      timeSlot: timeSlot || '',
      reason: reason || '',
      callType: callType || 'scheduled',
      isEmergency: isEmergency || false,
      status: isEmergency ? 'approved' : 'pending', // Emergency auto-approved
    });

    const populated = await call.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name email' },
    ]);

    res.status(201).json({ videoCall: populated });
  } catch (error) { next(error); }
};


// @desc    Get my video calls (patient sees own, doctor sees incoming)
// @route   GET /api/video-calls
exports.getVideoCalls = async (req, res, next) => {
  try {
    const query = req.user.role === 'doctor'
      ? { doctor: req.user.id }
      : { patient: req.user.id };

    const calls = await VideoCall.find(query)
      .populate('patient', 'name email subscriptionTier')
      .populate('doctor', 'name specialization')
      .sort({ scheduledAt: -1 });

    // For doctors: count pending calls (notification badge)
    let pendingCount = 0;
    if (req.user.role === 'doctor') {
      pendingCount = await VideoCall.countDocuments({
        doctor: req.user.id,
        status: 'pending',
      });
    }

    res.json({ videoCalls: calls, pendingCount });
  } catch (error) { next(error); }
};


// @desc    Update video call status
// @route   PUT /api/video-calls/:id
exports.updateVideoCall = async (req, res, next) => {
  try {
    const { action, doctorNotes, newDate, newTimeSlot } = req.body;
    const call = await VideoCall.findById(req.params.id);
    if (!call) return res.status(404).json({ error: 'Video call not found' });

    const isPatient = call.patient.toString() === req.user.id;
    const isDoctor = call.doctor.toString() === req.user.id;
    if (!isPatient && !isDoctor) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // ── Doctor actions ──
    if (isDoctor) {
      switch (action) {
        case 'approve':
          call.status = 'approved';
          break;
        case 'reject':
          call.status = 'rejected';
          if (doctorNotes) call.doctorNotes = doctorNotes;
          break;
        case 'start':
          call.status = 'in-progress';
          call.startedAt = new Date();
          break;
        case 'complete':
          call.status = 'completed';
          call.endedAt = new Date();
          if (call.startedAt) {
            call.duration = Math.round((call.endedAt - call.startedAt) / 60000);
          }
          if (doctorNotes) call.doctorNotes = doctorNotes;
          break;
        case 'cancel':
          call.status = 'cancelled';
          if (doctorNotes) call.doctorNotes = doctorNotes;
          break;
        case 'reschedule':
          if (newDate) call.scheduledAt = new Date(newDate);
          if (newTimeSlot) call.timeSlot = newTimeSlot;
          call.status = 'approved'; // Auto-approve reschedule
          break;
        case 'missed':
          call.status = 'missed';
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    // ── Patient actions ──
    if (isPatient) {
      switch (action) {
        case 'cancel':
          if (['completed', 'rejected', 'cancelled'].includes(call.status)) {
            return res.status(400).json({ error: 'Cannot cancel this call' });
          }
          call.status = 'cancelled';
          break;
        case 'request-postpone':
          if (['completed', 'rejected', 'cancelled'].includes(call.status)) {
            return res.status(400).json({ error: 'Cannot postpone this call' });
          }
          call.status = 'postpone-requested';
          if (newDate) call.requestedNewDate = newDate;
          if (newTimeSlot) call.requestedNewTimeSlot = newTimeSlot;
          break;
        default:
          return res.status(400).json({ error: 'Patients can: cancel, request-postpone' });
      }
    }

    await call.save();
    const populated = await call.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'patient', select: 'name email subscriptionTier' },
    ]);

    res.json({ videoCall: populated });
  } catch (error) { next(error); }
};


// @desc    Get room info for joining a call
// @route   GET /api/video-calls/:id/room
exports.getRoomInfo = async (req, res, next) => {
  try {
    const call = await VideoCall.findById(req.params.id)
      .populate('patient', 'name')
      .populate('doctor', 'name');
    if (!call) return res.status(404).json({ error: 'Call not found' });

    const isParticipant = [call.patient._id.toString(), call.doctor._id.toString()].includes(req.user.id);
    if (!isParticipant) return res.status(403).json({ error: 'Not authorized' });

    if (!['approved', 'in-progress'].includes(call.status)) {
      return res.status(400).json({ error: 'Call is not active. Status: ' + call.status });
    }

    // Determine which name to display for the current user
    const displayName = req.user.id === call.patient._id.toString()
      ? call.patient.name
      : `Dr. ${call.doctor.name}`;

    res.json({
      roomId: call.roomId,
      domain: 'meet.jit.si',
      displayName,
      patientName: call.patient.name,
      doctorName: call.doctor.name,
      scheduledAt: call.scheduledAt,
      isEmergency: call.isEmergency,
      callId: call._id,
    });
  } catch (error) { next(error); }
};
