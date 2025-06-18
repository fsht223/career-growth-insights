const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Public routes - no auth required
router.get('/:id', sessionController.getTestInfo);
router.post('/:id/register', sessionController.registerForTest);
router.get('/:id/questions', sessionController.getQuestions);
router.post('/:id/answer', sessionController.saveAnswer);
router.post('/:id/complete', sessionController.completeTest);

module.exports = router;