/**
 * Wearable Integration Controller
 * Architecture-ready endpoints for Apple HealthKit / Google Fit sync.
 * Accepts health data from wearable devices and maps to HeartGuard metrics.
 */

const User = require('../models/User');

// Wearable metric mappings
const WEARABLE_MAP = {
  // Apple HealthKit identifiers
  'HKQuantityTypeIdentifierHeartRate': 'thalach',
  'HKQuantityTypeIdentifierBloodPressureSystolic': 'trestbps',
  'HKQuantityTypeIdentifierBloodGlucose': 'fbs',
  'HKQuantityTypeIdentifierOxygenSaturation': 'spo2',
  'HKQuantityTypeIdentifierStepCount': 'steps',
  'HKQuantityTypeIdentifierActiveEnergyBurned': 'calories',
  // Google Fit data types
  'com.google.heart_rate.bpm': 'thalach',
  'com.google.blood_pressure': 'trestbps',
  'com.google.blood_glucose': 'fbs',
  'com.google.step_count.delta': 'steps',
};

// @desc    Sync wearable data
// @route   POST /api/wearables/sync
exports.syncWearableData = async (req, res, next) => {
  try {
    const { source, metrics, deviceInfo } = req.body;

    if (!source || !metrics || !Array.isArray(metrics)) {
      return res.status(400).json({ error: 'Source and metrics array are required' });
    }

    // Map wearable metrics to HeartGuard format
    const mappedMetrics = {};
    const unmapped = [];

    for (const metric of metrics) {
      const hgKey = WEARABLE_MAP[metric.type];
      if (hgKey) {
        mappedMetrics[hgKey] = {
          value: metric.value,
          unit: metric.unit,
          timestamp: metric.timestamp,
          source: source,
        };
      } else {
        unmapped.push(metric.type);
      }
    }

    // Store wearable data reference on user
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        'wearableData.lastSync': new Date(),
        'wearableData.source': source,
        'wearableData.deviceInfo': deviceInfo,
      },
    });

    res.json({
      synced: Object.keys(mappedMetrics).length,
      mapped: mappedMetrics,
      unmappedTypes: unmapped,
      message: `Successfully synced ${Object.keys(mappedMetrics).length} metrics from ${source}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get supported wearable integrations
// @route   GET /api/wearables/supported
exports.getSupportedDevices = (req, res) => {
  res.json({
    integrations: [
      {
        id: 'apple_health',
        name: 'Apple HealthKit',
        status: 'architecture-ready',
        metrics: ['Heart Rate', 'Blood Pressure', 'Blood Glucose', 'Steps', 'SpO2'],
        icon: '⌚',
      },
      {
        id: 'google_fit',
        name: 'Google Fit',
        status: 'architecture-ready',
        metrics: ['Heart Rate', 'Blood Pressure', 'Blood Glucose', 'Steps'],
        icon: '📱',
      },
      {
        id: 'fitbit',
        name: 'Fitbit',
        status: 'planned',
        metrics: ['Heart Rate', 'Steps', 'Sleep'],
        icon: '⌚',
      },
    ],
  });
};

// @desc    Get wearable sync status
// @route   GET /api/wearables/status
exports.getWearableStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('wearableData');
    res.json({
      connected: !!user.wearableData?.lastSync,
      lastSync: user.wearableData?.lastSync,
      source: user.wearableData?.source,
      deviceInfo: user.wearableData?.deviceInfo,
    });
  } catch (error) {
    next(error);
  }
};
