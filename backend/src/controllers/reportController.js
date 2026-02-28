const Prediction = require('../models/Prediction');
const User = require('../models/User');

// Value mapping helpers
const CP_MAP = { 0: 'Typical Angina', 1: 'Atypical Angina', 2: 'Non-anginal Pain', 3: 'Asymptomatic' };
const ECG_MAP = { 0: 'Normal', 1: 'ST-T Abnormality', 2: 'LV Hypertrophy' };
const SLOPE_MAP = { 0: 'Upsloping', 1: 'Flat', 2: 'Downsloping' };
const THAL_MAP = { 0: 'Normal', 1: 'Fixed Defect', 2: 'Reversible Defect', 3: 'Not Described' };

function formatParam(pred) {
  const m = pred.healthMetrics;
  return {
    age: m.age, sex: m.sex === 1 ? 'Male' : 'Female',
    cp: CP_MAP[m.cp] || m.cp, trestbps: m.trestbps, chol: m.chol,
    fbs: m.fbs === 1 ? 'True' : 'False', restecg: ECG_MAP[m.restecg] || m.restecg,
    thalach: m.thalach, exang: m.exang === 1 ? 'Yes' : 'No',
    oldpeak: m.oldpeak, slope: SLOPE_MAP[m.slope] || m.slope,
    ca: m.ca, thal: THAL_MAP[m.thal] || m.thal,
  };
}

// ── Risk explanation (like CardioScan /explain/:id)
function buildExplanation(pred) {
  const m = pred.healthMetrics;
  const pct = Math.round(pred.riskScore * 100 * 10) / 10;
  const factors = [];

  if (m.thalach < 120) {
    factors.push({ icon: '❤️', level: 'high', text: `Max heart rate of ${m.thalach} bpm is significantly low. A reduced peak heart rate often indicates impaired cardiac function.` });
  } else if (m.thalach < 150) {
    factors.push({ icon: '❤️', level: 'moderate', text: `Max heart rate of ${m.thalach} bpm is below the ideal range (>150 bpm), which can be a mild cardiac indicator.` });
  }

  if (m.oldpeak >= 2.0) {
    factors.push({ icon: '📉', level: 'high', text: `ST depression of ${m.oldpeak} is elevated (≥2.0). This suggests significant exercise-induced ischaemia.` });
  } else if (m.oldpeak >= 1.0) {
    factors.push({ icon: '📉', level: 'moderate', text: `ST depression of ${m.oldpeak} is moderately elevated (1.0–2.0), indicating possible myocardial stress under exercise.` });
  }

  if (m.chol >= 240) {
    factors.push({ icon: '🩸', level: 'high', text: `Cholesterol of ${m.chol} mg/dl is high (≥240). Elevated cholesterol significantly increases atherosclerosis risk.` });
  } else if (m.chol >= 200) {
    factors.push({ icon: '🩸', level: 'moderate', text: `Cholesterol of ${m.chol} mg/dl is borderline high (200–240), warranting dietary attention.` });
  }

  if (m.trestbps >= 140) {
    factors.push({ icon: '💢', level: 'high', text: `Resting blood pressure of ${m.trestbps} mmHg indicates hypertension (≥140), a major independent risk factor for heart disease.` });
  } else if (m.trestbps >= 130) {
    factors.push({ icon: '💢', level: 'moderate', text: `Resting BP of ${m.trestbps} mmHg is elevated (130–140), classified as Stage 1 hypertension.` });
  }

  if (m.ca >= 2) {
    factors.push({ icon: '🔬', level: 'high', text: `${m.ca} major vessels coloured by fluoroscopy — multiple blocked vessels strongly correlate with coronary artery disease.` });
  } else if (m.ca === 1) {
    factors.push({ icon: '🔬', level: 'moderate', text: `1 major vessel coloured by fluoroscopy — single-vessel disease present, warrants monitoring.` });
  }

  if (m.exang === 1) {
    factors.push({ icon: '🏃', level: 'high', text: 'Exercise-induced angina is present — chest pain triggered by exertion is a strong indicator of reduced coronary blood flow.' });
  }

  if (m.cp === 0) {
    factors.push({ icon: '🫀', level: 'high', text: 'Chest pain type is typical angina — the classic presentation most strongly associated with obstructive coronary disease.' });
  } else if (m.cp === 1 || m.cp === 2) {
    factors.push({ icon: '🫀', level: 'moderate', text: `Chest pain type is ${CP_MAP[m.cp]}, which has moderate association with cardiac causes.` });
  }

  if (m.age >= 60) {
    factors.push({ icon: '📅', level: 'moderate', text: `Age of ${m.age} years — cardiovascular risk increases substantially after 60.` });
  }

  if (m.sex === 1 && m.age >= 45) {
    factors.push({ icon: '👤', level: 'moderate', text: `Male patients aged 45+ have a statistically higher baseline risk of coronary heart disease.` });
  }

  if (factors.length === 0) {
    factors.push({ icon: '✅', level: 'low', text: 'All clinical parameters are within normal ranges. The model did not identify strong individual risk indicators.' });
  }

  const summary = `This patient has a ${pct}% predicted probability of heart disease. ` +
    (pred.riskScore >= 0.3 ? 'The following factors are driving the elevated risk:' : 'Most parameters are within healthy ranges.');

  return { summary, factors, probability: pct, has_disease: pred.riskScore >= 0.3 };
}

// ── Risk factor analysis for PDF
function buildRiskAnalysis(m) {
  const rows = [];
  const thr = {
    thalach: { label: 'Max Heart Rate', value: `${m.thalach} bpm`, normal: 'Normal: >150 bpm', level: m.thalach < 120 ? 'High' : m.thalach < 150 ? 'Moderate' : 'Normal' },
    oldpeak: { label: 'ST Depression', value: `${m.oldpeak}`, normal: 'Low risk: <1.0', level: m.oldpeak >= 2.0 ? 'High' : m.oldpeak >= 1.0 ? 'Moderate' : 'Normal' },
    chol: { label: 'Cholesterol', value: `${m.chol} mg/dl`, normal: 'Normal: <200 mg/dl', level: m.chol >= 240 ? 'High' : m.chol >= 200 ? 'Moderate' : 'Normal' },
    trestbps: { label: 'Resting BP', value: `${m.trestbps} mmHg`, normal: 'Normal: <130 mmHg', level: m.trestbps >= 140 ? 'High' : m.trestbps >= 130 ? 'Moderate' : 'Normal' },
    ca: { label: 'Major Vessels', value: `${m.ca}`, normal: 'Normal: 0', level: m.ca >= 2 ? 'High' : m.ca === 1 ? 'Moderate' : 'Normal' },
    exang: { label: 'Exercise Angina', value: m.exang === 1 ? 'Yes' : 'No', normal: 'Normal: No', level: m.exang === 1 ? 'Risk' : 'Normal' },
  };
  for (const [, v] of Object.entries(thr)) rows.push(v);
  return rows;
}


// @desc    Get explanation for a prediction
// @route   GET /api/predict/:id/explain
exports.getExplanation = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('user', 'name');
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    if (req.user.role !== 'doctor' && prediction.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    res.json(buildExplanation(prediction));
  } catch (error) { next(error); }
};


// @desc    Get PDF report data for a prediction
// @route   GET /api/predict/:id/report
exports.getReportData = async (req, res, next) => {
  try {
    const prediction = await Prediction.findById(req.params.id).populate('user', 'name email');
    if (!prediction) return res.status(404).json({ error: 'Prediction not found' });
    if (req.user.role !== 'doctor' && prediction.user._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const params = formatParam(prediction);
    const analysis = buildRiskAnalysis(prediction.healthMetrics);
    const explanation = buildExplanation(prediction);
    const pct = Math.round(prediction.riskScore * 100 * 10) / 10;

    res.json({
      id: prediction._id,
      patientName: prediction.user.name,
      date: prediction.createdAt,
      probability: pct,
      riskCategory: prediction.riskCategory,
      hasDiseaseRisk: prediction.riskScore >= 0.3,
      params,
      riskAnalysis: analysis,
      explanation,
      model: 'Gradient Boosting Classifier (scikit-learn)',
      dataset: 'Cleveland Heart Disease Dataset (1,025 samples)',
    });
  } catch (error) { next(error); }
};


// @desc    Doctor dashboard stats
// @route   GET /api/predict/dashboard-stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Doctor only' });

    const allPreds = await Prediction.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    const totalScans = allPreds.length;
    const atRisk = allPreds.filter(p => p.riskScore >= 0.3).length;
    const totalPatients = await User.countDocuments({ role: 'patient' });

    // Patients breakdown
    const patientMap = {};
    for (const p of allPreds) {
      const uid = p.user._id.toString();
      if (!patientMap[uid]) patientMap[uid] = { name: p.user.name, scans: 0, atRisk: 0, probs: [] };
      patientMap[uid].scans++;
      patientMap[uid].probs.push(p.riskScore);
      if (p.riskScore >= 0.3) patientMap[uid].atRisk++;
    }
    const patients = Object.entries(patientMap).map(([id, v]) => ({
      id, name: v.name, scans: v.scans, atRisk: v.atRisk,
      avgRisk: Math.round((v.probs.reduce((a, b) => a + b, 0) / v.probs.length) * 1000) / 10,
    })).sort((a, b) => b.scans - a.scans);

    // Recent scans
    const recent = allPreds.slice(0, 20).map(p => ({
      id: p._id, patientName: p.user.name,
      date: p.createdAt,
      age: p.healthMetrics.age, sex: p.healthMetrics.sex === 1 ? 'M' : 'F',
      riskScore: Math.round(p.riskScore * 1000) / 10,
      riskCategory: p.riskCategory,
      trestbps: p.healthMetrics.trestbps, chol: p.healthMetrics.chol,
      thalach: p.healthMetrics.thalach,
    }));

    res.json({
      summary: { totalPatients, totalScans, atRisk, safe: totalScans - atRisk,
        riskPct: totalScans ? Math.round(atRisk / totalScans * 1000) / 10 : 0 },
      patients, recent,
    });
  } catch (error) { next(error); }
};


// @desc    Get patient profile data (doctor only)
// @route   GET /api/predict/patient/:patientId
exports.getPatientProfile = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Doctor only' });

    const patient = await User.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const preds = await Prediction.find({ user: patient._id }).sort({ createdAt: 1 });
    const total = preds.length;
    const atRisk = preds.filter(p => p.riskScore >= 0.3).length;
    const avgRisk = total ? Math.round(preds.reduce((s, p) => s + p.riskScore, 0) / total * 1000) / 10 : 0;

    const trend = preds.map(p => ({
      date: p.createdAt,
      prob: Math.round(p.riskScore * 1000) / 10,
      hasDiseaseRisk: p.riskScore >= 0.3,
    }));

    const scans = preds.reverse().map(p => ({
      id: p._id, date: p.createdAt,
      riskScore: Math.round(p.riskScore * 1000) / 10,
      riskCategory: p.riskCategory,
      hasDiseaseRisk: p.riskScore >= 0.3,
      healthMetrics: p.healthMetrics,
      params: formatParam(p),
    }));

    const latest = scans.length ? scans[0] : null;

    res.json({
      patient: { id: patient._id, name: patient.name, email: patient.email, role: patient.role },
      summary: { total, atRisk, safe: total - atRisk, avgRisk },
      trend, scans, latest,
    });
  } catch (error) { next(error); }
};


// @desc    Export all predictions as JSON (for frontend Excel generation)
// @route   GET /api/predict/export
exports.exportData = async (req, res, next) => {
  try {
    if (req.user.role !== 'doctor') return res.status(403).json({ error: 'Doctor only' });

    const preds = await Prediction.find({}).populate('user', 'name email').sort({ createdAt: -1 });
    const data = preds.map((p, i) => ({
      '#': i + 1,
      Patient: p.user.name,
      Date: p.createdAt,
      Age: p.healthMetrics.age,
      Sex: p.healthMetrics.sex === 1 ? 'Male' : 'Female',
      'Chest Pain': CP_MAP[p.healthMetrics.cp] || p.healthMetrics.cp,
      'Resting BP': p.healthMetrics.trestbps,
      Cholesterol: p.healthMetrics.chol,
      'Fasting Sugar': p.healthMetrics.fbs === 1 ? 'Yes' : 'No',
      ECG: ECG_MAP[p.healthMetrics.restecg] || p.healthMetrics.restecg,
      'Max HR': p.healthMetrics.thalach,
      'Exercise Angina': p.healthMetrics.exang === 1 ? 'Yes' : 'No',
      'ST Depression': p.healthMetrics.oldpeak,
      'ST Slope': SLOPE_MAP[p.healthMetrics.slope] || p.healthMetrics.slope,
      'Major Vessels': p.healthMetrics.ca,
      Thalassemia: THAL_MAP[p.healthMetrics.thal] || p.healthMetrics.thal,
      Result: p.riskScore >= 0.3 ? 'AT RISK' : 'LOW RISK',
      'Risk %': Math.round(p.riskScore * 1000) / 10,
    }));

    res.json({ data });
  } catch (error) { next(error); }
};
