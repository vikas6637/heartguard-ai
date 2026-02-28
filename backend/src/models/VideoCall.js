const mongoose = require('mongoose');
const crypto = require('crypto');

const videoCallSchema = new mongoose.Schema({
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
  scheduledAt: { type: Date, required: true },
  timeSlot: { type: String },
  callType: {
    type: String,
    enum: ['instant', 'scheduled'],
    default: 'scheduled',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in-progress', 'completed', 'cancelled', 'missed', 'postpone-requested'],
    default: 'pending',
  },
  reason: { type: String, maxlength: 500 },
  doctorNotes: { type: String },
  // Jitsi Meet room
  roomId: {
    type: String,
    default: () => `hg-${crypto.randomBytes(6).toString('hex')}`,
    unique: true,
  },
  duration: { type: Number, default: 0 }, // in minutes
  startedAt: { type: Date },
  endedAt: { type: Date },
  isEmergency: { type: Boolean, default: false },
  requestedNewDate: { type: Date },
  requestedNewTimeSlot: { type: String },
}, { timestamps: true });

// Index for weekly limit queries
videoCallSchema.index({ patient: 1, createdAt: -1 });
videoCallSchema.index({ doctor: 1, status: 1 });

module.exports = mongoose.model('VideoCall', videoCallSchema);
