#!/usr/bin/env node
// ============================================================
// Smart Skill-Gap Analyzer — Database Initialiser
// Usage:  node database/init.js
// ============================================================

'use strict';

const path    = require('path');
const fs      = require('fs');
const Database = require('better-sqlite3');

// ── Paths ────────────────────────────────────────────────────
const DB_DIR    = __dirname;                              // database/
const DB_PATH   = path.join(DB_DIR, 'skillgap.db');
const SCHEMA    = path.join(DB_DIR, 'schema.sql');
const SEED      = path.join(DB_DIR, 'seed.sql');

// ── Helpers ──────────────────────────────────────────────────
function readSQL(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Execute a full SQL script (multi-statement) inside a single
 * transaction using better-sqlite3's db.exec().
 */
function runScript(db, filePath, label) {
  const sql = readSQL(filePath);
  console.log(`  ▶  Running ${label}…`);
  db.exec(sql);
  console.log(`  ✔  ${label} applied.`);
}

/**
 * Check whether seed data is already present.
 * We look for at least one row in career_roles; if it exists
 * we assume the DB has already been seeded and skip re-seeding.
 */
function isAlreadySeeded(db) {
  try {
    const row = db.prepare('SELECT COUNT(*) AS cnt FROM career_roles').get();
    return row.cnt > 0;
  } catch {
    // Table doesn't exist yet — schema hasn't run either.
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────
function init() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  Smart Skill-Gap Analyzer — DB Initialiser  ');
  console.log('══════════════════════════════════════════════');
  console.log(`  DB path : ${DB_PATH}`);

  const dbExists = fs.existsSync(DB_PATH);
  if (dbExists) {
    console.log('  Status  : existing database file detected.');
  } else {
    console.log('  Status  : no database found — creating fresh.');
  }

  // Open (or create) the database file
  const db = new Database(DB_PATH, {
    // verbose: console.log   // uncomment to log every statement
  });

  // Recommended pragmas for reliability & performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');

  // ── 1. Schema ─────────────────────────────────────────────
  console.log('\n[1/2] Schema');
  runScript(db, SCHEMA, 'schema.sql');

  // ── 2. Seed ───────────────────────────────────────────────
  console.log('\n[2/2] Seed data');

  if (isAlreadySeeded(db)) {
    console.log('  ⚠   Seed data already present — skipping re-seed.');
    console.log('      (Delete skillgap.db and re-run to reset.)\n');
  } else {
    // Wrap entire seed in a single transaction for atomicity
    const seedTransaction = db.transaction(() => {
      runScript(db, SEED, 'seed.sql');
    });
    seedTransaction();

    // Quick verification
    const roleCount  = db.prepare('SELECT COUNT(*) AS cnt FROM career_roles').get().cnt;
    const skillCount = db.prepare('SELECT COUNT(*) AS cnt FROM required_skills').get().cnt;
    console.log(`\n  ✔  Inserted ${roleCount} career roles.`);
    console.log(`  ✔  Inserted ${skillCount} required skills.`);
  }

  db.close();

  console.log('\n══════════════════════════════════════════════');
  console.log('  Database initialized successfully ✓          ');
  console.log('══════════════════════════════════════════════\n');
}

init();
