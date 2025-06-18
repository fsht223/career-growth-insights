const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { authenticateToken, requireCoach } = require('../middleware/auth');
const { validateCreateTest } = require('../middleware/validation');

router.use(authenticateToken);
router.use(requireCoach);

router.post('/', validateCreateTest, testController.createTest);
router.get('/', testController.getTests);
router.get('/:id', testController.getTestDetails);
router.delete('/:id', testController.deleteTest);

module.exports = router;