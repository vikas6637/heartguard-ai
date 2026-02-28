const express = require('express');
const router = express.Router();
const { exportFHIR, getCapabilityStatement } = require('../controllers/fhirController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/metadata', getCapabilityStatement);
router.get('/export', protect, exportFHIR);

module.exports = router;
