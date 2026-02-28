/**
 * FHIR-Ready Data Export Controller
 * Transforms HeartGuard AI data into FHIR R4 compliant resources.
 * Supports: Patient, Observation, RiskAssessment, Appointment
 */

const User = require('../models/User');
const Prediction = require('../models/Prediction');
const Appointment = require('../models/Appointment');

// Map HeartGuard health metrics to LOINC codes
const LOINC_CODES = {
  age: { code: '30525-0', display: 'Age', unit: 'a' },
  trestbps: { code: '8480-6', display: 'Systolic blood pressure', unit: 'mm[Hg]' },
  chol: { code: '2093-3', display: 'Total cholesterol', unit: 'mg/dL' },
  thalach: { code: '8867-4', display: 'Heart rate', unit: '/min' },
  fbs: { code: '1558-6', display: 'Fasting glucose', unit: 'mg/dL' },
  oldpeak: { code: '8625-6', display: 'ST depression', unit: 'mm' },
};

// Transform user → FHIR Patient resource
function toFHIRPatient(user) {
  return {
    resourceType: 'Patient',
    id: user._id.toString(),
    meta: { lastUpdated: user.updatedAt?.toISOString() },
    identifier: [{
      system: 'https://heartguard.ai/patients',
      value: user._id.toString(),
    }],
    name: [{ use: 'official', text: user.name }],
    telecom: [{ system: 'email', value: user.email }],
    active: true,
  };
}

// Transform prediction → FHIR RiskAssessment + Observations
function toFHIRRiskAssessment(prediction, userId) {
  const observations = [];
  const metrics = prediction.healthMetrics || {};

  // Create Observation for each metric
  for (const [key, value] of Object.entries(metrics)) {
    if (LOINC_CODES[key] && value !== undefined) {
      observations.push({
        resourceType: 'Observation',
        id: `obs-${prediction._id}-${key}`,
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: LOINC_CODES[key].code,
            display: LOINC_CODES[key].display,
          }],
        },
        subject: { reference: `Patient/${userId}` },
        effectiveDateTime: prediction.createdAt?.toISOString(),
        valueQuantity: {
          value: Number(value),
          unit: LOINC_CODES[key].unit,
          system: 'http://unitsofmeasure.org',
        },
      });
    }
  }

  const riskAssessment = {
    resourceType: 'RiskAssessment',
    id: prediction._id.toString(),
    status: 'final',
    subject: { reference: `Patient/${userId}` },
    occurrenceDateTime: prediction.createdAt?.toISOString(),
    prediction: [{
      outcome: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '53741008',
          display: 'Coronary arteriosclerosis',
        }],
      },
      probabilityDecimal: prediction.riskScore,
      qualitativeRisk: {
        coding: [{
          system: 'https://heartguard.ai/risk-category',
          code: prediction.riskCategory?.toLowerCase() || 'unknown',
          display: prediction.riskCategory || 'Unknown',
        }],
      },
    }],
    basis: observations.map(o => ({ reference: `Observation/${o.id}` })),
  };

  return { riskAssessment, observations };
}

// Transform appointment → FHIR Appointment
function toFHIRAppointment(apt) {
  return {
    resourceType: 'Appointment',
    id: apt._id.toString(),
    status: apt.status === 'scheduled' ? 'booked' : apt.status === 'cancelled' ? 'cancelled' : 'fulfilled',
    description: apt.reason || 'Heart health consultation',
    start: apt.appointmentDate?.toISOString(),
    participant: [
      {
        actor: { reference: `Patient/${apt.patient?._id || apt.patient}`, display: apt.patient?.name },
        status: 'accepted',
      },
      {
        actor: { reference: `Practitioner/${apt.doctor?._id || apt.doctor}`, display: apt.doctor?.name },
        status: 'accepted',
      },
    ],
  };
}

// @desc    Export user data as FHIR Bundle
// @route   GET /api/fhir/export
exports.exportFHIR = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const predictions = await Prediction.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50);
    const appointments = await Appointment.find({
      $or: [{ patient: req.user.id }, { doctor: req.user.id }],
    }).populate('patient doctor');

    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: new Date().toISOString(),
      meta: {
        source: 'https://heartguard.ai',
        profile: ['http://hl7.org/fhir/StructureDefinition/Bundle'],
      },
      entry: [],
    };

    // Patient
    bundle.entry.push({
      fullUrl: `Patient/${user._id}`,
      resource: toFHIRPatient(user),
    });

    // Predictions → RiskAssessments + Observations
    for (const pred of predictions) {
      const { riskAssessment, observations } = toFHIRRiskAssessment(pred, user._id);
      bundle.entry.push({ fullUrl: `RiskAssessment/${riskAssessment.id}`, resource: riskAssessment });
      for (const obs of observations) {
        bundle.entry.push({ fullUrl: `Observation/${obs.id}`, resource: obs });
      }
    }

    // Appointments
    for (const apt of appointments) {
      bundle.entry.push({
        fullUrl: `Appointment/${apt._id}`,
        resource: toFHIRAppointment(apt),
      });
    }

    bundle.total = bundle.entry.length;

    res.json(bundle);
  } catch (error) {
    next(error);
  }
};

// @desc    Get FHIR Capability Statement
// @route   GET /api/fhir/metadata
exports.getCapabilityStatement = (req, res) => {
  res.json({
    resourceType: 'CapabilityStatement',
    status: 'active',
    date: new Date().toISOString(),
    kind: 'instance',
    software: { name: 'HeartGuard AI', version: '1.0.0' },
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      resource: [
        { type: 'Patient', interaction: [{ code: 'read' }] },
        { type: 'Observation', interaction: [{ code: 'read' }, { code: 'search-type' }] },
        { type: 'RiskAssessment', interaction: [{ code: 'read' }, { code: 'search-type' }] },
        { type: 'Appointment', interaction: [{ code: 'read' }, { code: 'search-type' }] },
      ],
    }],
  });
};
