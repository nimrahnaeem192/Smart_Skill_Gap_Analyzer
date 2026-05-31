// backend/controllers/rolesController.js
'use strict';

const db = require('../db/db');

// ── GET /api/roles ────────────────────────────────────────────
const getAllRoles = (req, res, next) => {
  try {
    const roles = db
      .prepare('SELECT role_id, role_name, domain, description FROM career_roles ORDER BY role_id')
      .all();

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/roles/:id/skills ─────────────────────────────────
const getRoleSkills = (req, res, next) => {
  try {
    const { id } = req.params;

    const role = db
      .prepare('SELECT role_id, role_name, domain, description FROM career_roles WHERE role_id = ?')
      .get(id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role with id ${id} not found.`,
      });
    }

    const skills = db
      .prepare(
        `SELECT skill_id, skill_name, weight, min_level
         FROM   required_skills
         WHERE  role_id = ?
         ORDER  BY weight DESC`
      )
      .all(id);

    return res.status(200).json({
      success: true,
      data: { role, skills },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRoles, getRoleSkills };
