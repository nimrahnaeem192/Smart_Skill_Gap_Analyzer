// backend/controllers/authController.js
'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../db/db');
const logger = require('../services/logger');

const SALT_ROUNDS = 12;

/** Generate a signed JWT for a user record */
function generateToken(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ── POST /api/auth/register ───────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check duplicate email
    const existing = db
      .prepare('SELECT user_id FROM users WHERE email = ?')
      .get(email.toLowerCase().trim());

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = db
      .prepare(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
      )
      .run(name.trim(), email.toLowerCase().trim(), password_hash);

    const newUser = db
      .prepare('SELECT user_id, name, email, created_at FROM users WHERE user_id = ?')
      .get(result.lastInsertRowid);

    const token = generateToken(newUser);

    logger.info(`New user registered: ${newUser.email} (id=${newUser.user_id})`);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { user: newUser, token },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email.toLowerCase().trim());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    logger.info(`User logged in: ${user.email}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          user_id:    user.user_id,
          name:       user.name,
          email:      user.email,
          created_at: user.created_at,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login };
