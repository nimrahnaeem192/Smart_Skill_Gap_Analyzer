// backend/db/db.js
'use strict';

const path     = require('path');
const Database = require('better-sqlite3');
const logger   = require('../services/logger');

const DB_PATH = path.resolve(__dirname, '../../database/skillgap.db');

let db;

try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  logger.info(`Database connected: ${DB_PATH}`);
} catch (err) {
  logger.error(`Failed to connect to database: ${err.message}`);
  process.exit(1);
}

module.exports = db;
