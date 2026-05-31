// backend/controllers/analyzeController.js
'use strict';

const db                 = require('../db/db');
const { analyzeGaps }    = require('../services/gapAnalyzer');

// ── POST /api/analyze ─────────────────────────────────────────
// Body: { role_id: number, user_skills: [{skill_name, proficiency_level}] }
// Returns analysis without persisting — call /api/result/save to persist.
const analyze = (req, res, next) => {
  try {
    const { role_id, user_skills } = req.body;

    // Validate role exists
    const role = db
      .prepare('SELECT role_id, role_name, domain FROM career_roles WHERE role_id = ?')
      .get(role_id);

    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role with id ${role_id} not found.`,
      });
    }

    // Fetch required skills for the role
    const requiredSkills = db
      .prepare(
        `SELECT skill_name, weight, min_level
         FROM   required_skills
         WHERE  role_id = ?
         ORDER  BY weight DESC`
      )
      .all(role_id);

    if (!requiredSkills.length) {
      return res.status(422).json({
        success: false,
        message: 'No required skills defined for this role.',
      });
    }

    // Run the analysis
    const analysis = analyzeGaps(user_skills, requiredSkills);

    // Upsert user skills into user_skills table (best-effort, requires auth)
    if (req.user) {
      const upsert = db.prepare(
        `INSERT INTO user_skills (user_id, skill_name, proficiency_level)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, skill_name)
         DO UPDATE SET proficiency_level = excluded.proficiency_level,
                       added_at          = CURRENT_TIMESTAMP`
      );
      const upsertAll = db.transaction((skills) => {
        for (const s of skills) {
          upsert.run(req.user.user_id, s.skill_name, s.proficiency_level);
        }
      });
      upsertAll(user_skills);
    }

    return res.status(200).json({
      success: true,
      data: {
        role,
        ...analysis,
        // Pass back so the client can call /result/save
        _meta: {
          role_id,
          user_skills,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyze };
