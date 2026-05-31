// backend/routes/result.js
'use strict';

const express           = require('express');
const { body, param }   = require('express-validator');
const {
  saveResult,
  getResult,
  getResultPDF,
  getHistory,
}                       = require('../controllers/resultController');
const authMiddleware    = require('../middleware/authMiddleware');
const validateRequest   = require('../middleware/validateRequest');

const router = express.Router();

// All result routes require authentication
router.use(authMiddleware);

// POST /api/result/save
router.post(
  '/save',
  [
    body('role_id').isInt({ min: 1 }).withMessage('role_id must be a positive integer.'),
    body('user_skills').isArray({ min: 1 }).withMessage('user_skills must be a non-empty array.'),
    body('user_skills.*.skill_name').trim().notEmpty(),
    body('user_skills.*.proficiency_level').isInt({ min: 1, max: 5 }),
  ],
  validateRequest,
  saveResult
);

// GET /api/result/history/:userId  — must come BEFORE /:id to avoid clash
router.get(
  '/history/:userId',
  [param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer.')],
  validateRequest,
  getHistory
);

// GET /api/result/:id
router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer.')],
  validateRequest,
  getResult
);

// GET /api/result/:id/pdf
router.get(
  '/:id/pdf',
  [param('id').isInt({ min: 1 }).withMessage('id must be a positive integer.')],
  validateRequest,
  getResultPDF
);

module.exports = router;
