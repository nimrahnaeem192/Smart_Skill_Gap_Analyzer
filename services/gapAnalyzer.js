// backend/services/gapAnalyzer.js
'use strict';

/**
 * Determines the readiness level from a numeric score.
 * @param  {number} score  0–100
 * @returns {string}
 */
function scoreToLevel(score) {
  if (score >= 75) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  return 'Beginner';
}

/**
 * Core gap analysis engine.
 *
 * @param {Array<{skill_name: string, proficiency_level: number}>} userSkills
 *   Skills the user has declared, each with a proficiency_level 1–5.
 *
 * @param {Array<{skill_name: string, weight: number, min_level: number}>} requiredSkills
 *   Skills required for the target role, with weight (all weights sum to 100)
 *   and min_level (1–5).
 *
 * @returns {{
 *   score:          number,
 *   level:          string,
 *   gaps:           Array,
 *   strong_skills:  Array,
 *   roadmap_order:  Array
 * }}
 */
function analyzeGaps(userSkills, requiredSkills) {
  // Build a quick lookup: skill_name (lowercase) → user proficiency
  const userMap = new Map(
    userSkills.map(s => [s.skill_name.toLowerCase().trim(), s.proficiency_level])
  );

  let totalScore    = 0;
  const gaps         = [];
  const strongSkills = [];

  for (const req of requiredSkills) {
    const key       = req.skill_name.toLowerCase().trim();
    const userLevel = userMap.get(key) ?? 0;   // 0 = not entered

    // Contribution this skill makes to the overall score
    // Capped at the skill's full weight (i.e. cannot score > weight per skill)
    const contribution =
      userLevel === 0
        ? 0
        : Math.min((userLevel / req.min_level) * req.weight, req.weight);

    totalScore += contribution;

    // Classify the gap
    let gap_type;
    if (userLevel === 0) {
      gap_type = 'missing';
    } else if (userLevel < req.min_level) {
      gap_type = 'weak';
    } else {
      gap_type = 'adequate';
    }

    const gapEntry = {
      skill_name:     req.skill_name,
      gap_type,
      user_level:     userLevel,
      required_level: req.min_level,
      weight:         req.weight,
      contribution:   parseFloat(contribution.toFixed(2)),
    };

    if (gap_type === 'adequate') {
      strongSkills.push(gapEntry);
    } else {
      gaps.push(gapEntry);
    }
  }

  const score = parseFloat(Math.min(totalScore, 100).toFixed(2));
  const level = scoreToLevel(score);

  // Roadmap order: prioritise missing skills first (sorted by weight desc),
  // then weak skills (sorted by gap magnitude desc)
  const missing = gaps
    .filter(g => g.gap_type === 'missing')
    .sort((a, b) => b.weight - a.weight);

  const weak = gaps
    .filter(g => g.gap_type === 'weak')
    .sort((a, b) => {
      const gapA = a.required_level - a.user_level;
      const gapB = b.required_level - b.user_level;
      return gapB - gapA || b.weight - a.weight;
    });

  const roadmap_order = [...missing, ...weak].map(g => g.skill_name);

  return {
    score,
    level,
    gaps,
    strong_skills:  strongSkills,
    roadmap_order,
  };
}

module.exports = { analyzeGaps, scoreToLevel };
