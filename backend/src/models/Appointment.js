const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  appointmentDate: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'cancel-requested', 'postpone-requested', 'rescheduled'],
    default: 'pending',
  },
  reason: { type: String, maxlength: 500 },
  doctorNotes: { type: String },
  requestedNewDate: { type: Date },
  requestedNewTimeSlot: { type: String },
  linkedPrediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prediction',
  },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
