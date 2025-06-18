const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  handleValidationErrors
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  handleValidationErrors
];

const validateCreateTest = [
  body('projectName').trim().notEmpty().withMessage('Project name is required'),
  body('goldenLine').notEmpty().withMessage('Golden line is required'),
  body('language').isIn(['ru', 'kz', 'en']).withMessage('Invalid language'),
  body('reportRecipient').isIn(['coach', 'testee', 'both']).withMessage('Invalid recipient'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateCreateTest
};