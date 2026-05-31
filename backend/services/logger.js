// backend/services/logger.js
'use strict';

const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs   = require('fs');

const LOG_DIR = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
    }),
    new transports.File({
      filename: path.join(LOG_DIR, 'error.log'),
      level: 'error',
    }),
    new transports.File({
      filename: path.join(LOG_DIR, 'combined.log'),
    }),
  ],
});

module.exports = logger;
