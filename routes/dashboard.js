// backend/routes/dashboard.js
'use strict';

const express           = require('express');
const { param }         = require('express-validator');
const { getDashboard }  = require('../controllers/dashboardController');
const authMiddleware    = require('../middleware/authMiddleware');
const validateRequest   = require('../middleware/validateRequest');

const router = express.Router();

// GET /api/dashboard/:userId
router.get(
  '/:userId',
  authMiddleware,
  [param('userId').isInt({ min: 1 }).withMessage('userId must be a positive integer.')],
  validateRequest,
  getDashboard
);

module.exports = router;
