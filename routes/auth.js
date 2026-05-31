// backend/routes/auth.js
'use strict';

const express                = require('express');
const { body }               = require('express-validator');
const { register, login }    = require('../controllers/authController');
const validateRequest        = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ max: 100 }).withMessage('Name must be under 100 characters.'),
    body('email')
      .trim()
      .isEmail().withMessage('A valid email is required.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
  ],
  validateRequest,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validateRequest,
  login
);

module.exports = router;
