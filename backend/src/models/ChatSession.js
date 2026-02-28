const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now },
  }],
  extractedMetrics: { type: Map, of: mongoose.Schema.Types.Mixed },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatSession', chatSessionSchema);
