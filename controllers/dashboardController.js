// backend/controllers/dashboardController.js
'use strict';

const db = require('../db/db');

// ── GET /api/dashboard/:userId ────────────────────────────────
const getDashboard = (req, res, next) => {
  try {
    const { userId } = req.params;

    // Users can only view their own dashboard
    if (req.user.user_id !== parseInt(userId, 10)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    // Profile
    const profile = db
      .prepare(
        'SELECT user_id, name, email, created_at FROM users WHERE user_id = ?'
      )
      .get(userId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Last 5 analysis results
    const recentResults = db
      .prepare(
        `SELECT ar.result_id, ar.score, ar.level, ar.analyzed_at,
                cr.role_name, cr.domain
         FROM   analysis_results ar
         JOIN   career_roles cr ON cr.role_id = ar.role_id
         WHERE  ar.user_id = ?
         ORDER  BY ar.analyzed_at DESC
         LIMIT  5`
      )
      .all(userId);

    // Latest gaps (from the most recent analysis)
    let latestGaps = [];
    if (recentResults.length > 0) {
      const latestResultId = recentResults[0].result_id;
      latestGaps = db
        .prepare(
          `SELECT skill_name, gap_type, user_level, required_level, resource_url
           FROM   skill_gaps
           WHERE  result_id = ?
             AND  gap_type  IN ('missing', 'weak')
           ORDER  BY gap_type DESC, required_level DESC`
        )
        .all(latestResultId);
    }

    // Skill count
    const skillCount = db
      .prepare('SELECT COUNT(*) AS cnt FROM user_skills WHERE user_id = ?')
      .get(userId).cnt;

    // Overall best score
    const bestScore = db
      .prepare(
        `SELECT MAX(score) AS best, COUNT(*) AS total
         FROM   analysis_results
         WHERE  user_id = ?`
      )
      .get(userId);

    return res.status(200).json({
      success: true,
      data: {
        profile,
        stats: {
          total_analyses:  bestScore.total,
          best_score:      bestScore.best ?? 0,
          skills_recorded: skillCount,
        },
        recent_results: recentResults,
        latest_gaps:    latestGaps,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
