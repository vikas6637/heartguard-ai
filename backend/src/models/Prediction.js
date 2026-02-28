const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  healthMetrics: {
    age:      { type: Number, required: true },
    sex:      { type: Number, required: true },
    cp:       { type: Number, required: true },
    trestbps: { type: Number, required: true },
    chol:     { type: Number, required: true },
    fbs:      { type: Number, required: true },
    restecg:  { type: Number, required: true },
    thalach:  { type: Number, required: true },
    exang:    { type: Number, required: true },
    oldpeak:  { type: Number, required: true },
    slope:    { type: Number, required: true },
    ca:       { type: Number, required: true },
    thal:     { type: Number, required: true },
  },
  riskScore: { type: Number, required: true },
  riskCategory: {
    type: String,
    enum: ['Low', 'Moderate', 'High', 'Critical'],
  },
  featureImportance: { type: Map, of: Number },
  shapValues: { type: Map, of: Number },
  aiRecommendations: [{ type: String }],
  source: {
    type: String,
    enum: ['form', 'chatbot', 'wearable'],
    default: 'form',
  },
}, { timestamps: true });

module.exports = mongoose.model('Prediction', predictionSchema);
