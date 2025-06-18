const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, requireCoach } = require('../middleware/auth');

router.use(authenticateToken);
router.use(requireCoach);

router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;