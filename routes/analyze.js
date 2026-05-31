// backend/routes/analyze.js
'use strict';

const express           = require('express');
const { body }          = require('express-validator');
const { analyze }       = require('../controllers/analyzeController');
const authMiddleware    = require('../middleware/authMiddleware');
const validateRequest   = require('../middleware/validateRequest');

const router = express.Router();

// POST /api/analyze  (auth optional — skills upserted only if authenticated)
router.post(
  '/',
  authMiddleware,
  [
    body('role_id')
      .isInt({ min: 1 }).withMessage('role_id must be a positive integer.'),
    body('user_skills')
      .isArray({ min: 1 }).withMessage('user_skills must be a non-empty array.'),
    body('user_skills.*.skill_name')
      .trim()
      .notEmpty().withMessage('Each skill must have a skill_name.'),
    body('user_skills.*.proficiency_level')
      .isInt({ min: 1, max: 5 }).withMessage('proficiency_level must be between 1 and 5.'),
  ],
  validateRequest,
  analyze
);

module.exports = router;
