// backend/middleware/errorHandler.js
'use strict';

const logger = require('../services/logger');

/**
 * Global Express error-handling middleware.
 * Must be registered LAST, after all routes.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status  = err.status || err.statusCode || 500;
  const isProd  = process.env.NODE_ENV === 'production';

  logger.error(`[${req.method}] ${req.originalUrl} — ${err.message}`, {
    stack:  err.stack,
    status,
    body:   req.body,
    params: req.params,
    query:  req.query,
  });

  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Include stack trace only in development
    ...(isProd ? {} : { stack: err.stack }),
  });
};

module.exports = errorHandler;
