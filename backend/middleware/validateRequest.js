// backend/middleware/validateRequest.js
'use strict';

const { validationResult } = require('express-validator');

/**
 * Reads express-validator results and returns 422 if any errors exist.
 * Place after validator chains, before the controller.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = validateRequest;
