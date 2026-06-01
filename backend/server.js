// backend/server.js
'use strict';

require('dotenv').config();

const express      = require('express');
const helmet       = require('helmet');
const cors         = require('cors');
const logger       = require('./services/logger');
const errorHandler = require('./middleware/errorHandler');

// ── Route imports ─────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const rolesRoutes     = require('./routes/roles');
const analyzeRoutes   = require('./routes/analyze');
const resultRoutes    = require('./routes/result');
const dashboardRoutes = require('./routes/dashboard');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Security & parsing middleware ─────────────────────────────
app.use(helmet());

app.use(cors({
  origin: 'https://smart-skill-gap-analyzer.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request logger ────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// ── Health check (public) ─────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status:  'ok',
    uptime:  process.uptime(),
    time:    new Date().toISOString(),
    env:     process.env.NODE_ENV || 'development',
  });
});

// ── API routes ────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/roles',     rolesRoutes);
app.use('/api/analyze',   analyzeRoutes);
app.use('/api/result',    resultRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── 404 handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
});

// ── Global error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`🚀 Smart Skill-Gap Analyzer API running on port ${PORT}`);
  logger.info(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app; // for testing
