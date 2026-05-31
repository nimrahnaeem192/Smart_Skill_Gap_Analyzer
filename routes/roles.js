// backend/routes/roles.js
'use strict';

const express                          = require('express');
const { getAllRoles, getRoleSkills }   = require('../controllers/rolesController');

const router = express.Router();

// GET /api/roles
router.get('/', getAllRoles);

// GET /api/roles/:id/skills
router.get('/:id/skills', getRoleSkills);

module.exports = router;
