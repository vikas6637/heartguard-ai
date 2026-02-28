const express = require('express');
const router = express.Router();
const { predict, getHistory, getPrediction, simulate, deletePrediction } = require('../controllers/predictionController');
const { getExplanation, getReportData, getDashboardStats, getPatientProfile, exportData } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, predict);
router.get('/history', protect, getHistory);
router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/export', protect, exportData);
router.get('/patient/:patientId', protect, getPatientProfile);
router.get('/:id/explain', protect, getExplanation);
router.get('/:id/report', protect, getReportData);
router.get('/:id', protect, getPrediction);
router.post('/simulate', protect, simulate);
router.delete('/:id', protect, deletePrediction);

module.exports = router;
