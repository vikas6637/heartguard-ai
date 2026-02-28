const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['free', 'premium', 'pro'],
    required: true,
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySubscriptionId: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
