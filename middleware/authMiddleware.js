// backend/middleware/authMiddleware.js
'use strict';

const jwt    = require('jsonwebtoken');
const logger = require('../services/logger');

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;          // { user_id, email, name, iat, exp }
    next();
  } catch (err) {
    logger.warn(`JWT verification failed: ${err.message}`);

    const message =
      err.name === 'TokenExpiredError'
        ? 'Token has expired. Please log in again.'
        : 'Invalid token.';

    return res.status(401).json({ success: false, message });
  }
};

module.exports = authMiddleware;
