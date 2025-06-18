const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes
router.get('/', authenticateToken, reportController.getReports);

// Public routes
router.get('/:id', reportController.getReport);
router.get('/:id/status', reportController.getReportStatus);
router.get('/:id/pdf', reportController.downloadPDF);

module.exports = router;