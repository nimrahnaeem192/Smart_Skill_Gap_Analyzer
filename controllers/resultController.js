// backend/controllers/resultController.js
'use strict';

const path            = require('path');
const os              = require('os');
const fs              = require('fs');
const db              = require('../db/db');
const { analyzeGaps } = require('../services/gapAnalyzer');
const logger          = require('../services/logger');

// Resource URL map — mirrors the catalogue in seed.sql
const RESOURCE_MAP = {
  'data structures & algorithms':          'https://www.coursera.org/learn/algorithms-part1',
  'python or javascript':                  'https://javascript.info',
  'python (numpy, pandas, scikit-learn)':  'https://www.learnpython.org',
  'system design':                         'https://www.educative.io/courses/grokking-the-system-design-interview',
  'version control (git)':                 'https://learngitbranching.js.org',
  'rest api design':                       'https://www.restapitutorial.com',
  'unit & integration testing':            'https://testautomationu.applitools.com',
  'sql & relational databases':            'https://www.sqlcourse.com',
  'sql & data querying':                   'https://www.sqlcourse.com',
  'ci/cd pipelines':                       'https://www.coursera.org/learn/devops-cloud-and-agile-foundations',
  'docker & containerisation':             'https://docker-curriculum.com',
  'cloud fundamentals (aws/gcp/azure)':    'https://aws.amazon.com/training/digital/',
  'machine learning fundamentals':         'https://www.coursera.org/learn/machine-learning',
  'statistics & probability':              'https://www.khanacademy.org/math/statistics-probability',
  'data wrangling & eda':                  'https://www.kaggle.com/learn/pandas',
  'data visualisation (matplotlib/seaborn/plotly)': 'https://www.coursera.org/learn/data-visualization',
  'deep learning (tensorflow/pytorch)':   'https://www.deeplearning.ai/courses/',
  'feature engineering':                   'https://www.kaggle.com/learn/feature-engineering',
  'model evaluation & validation':         'https://www.coursera.org/learn/machine-learning',
  'big data tools (spark/hadoop)':         'https://www.coursera.org/learn/big-data-essentials',
  'user research & usability testing':     'https://www.coursera.org/learn/ux-research-at-scale',
  'wireframing & prototyping':             'https://www.coursera.org/learn/wireframes-and-low-fidelity-prototypes',
  'figma / adobe xd':                      'https://www.youtube.com/c/figma',
  'information architecture':              'https://www.nngroup.com/articles/information-architecture-study-guide/',
  'visual design principles':              'https://www.coursera.org/learn/fundamentals-of-graphic-design',
  'interaction design':                    'https://www.interaction-design.org/courses',
  'accessibility (wcag standards)':        'https://www.udacity.com/course/web-accessibility--ud891',
  'design systems & component libraries':  'https://www.designbetter.co/design-systems-handbook',
  'html & css basics':                     'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
  'motion & micro-interactions':           'https://www.coursera.org/learn/fundamentals-of-graphic-design',
  'network security & protocols':          'https://www.coursera.org/learn/ibm-cybersecurity-analyst-assessment',
  'threat detection & incident response':  'https://www.sans.org/free/',
  'siem tools (splunk / qradar)':          'https://www.splunk.com/en_us/training/free-courses.html',
  'vulnerability assessment & pen testing':'https://www.hacksplaining.com',
  'operating systems (linux/windows)':     'https://linuxjourney.com',
  'cryptography & pki':                    'https://www.coursera.org/learn/crypto',
  'risk management & compliance (iso 27001/nist)': 'https://www.isaca.org/credentialing/cism',
  'malware analysis & forensics':          'https://www.cybrary.it/course/malware-analysis/',
  'cloud security':                        'https://cloudacademy.com/learning-paths/cloud-security-fundamentals-1373/',
  'scripting (python/bash)':               'https://automatetheboringstuff.com',
  'project planning & scheduling':         'https://www.coursera.org/learn/project-management-foundations',
  'stakeholder communication':             'https://www.pmi.org/learning/library',
  'risk management':                       'https://www.coursera.org/learn/risk-management-project',
  'agile & scrum methodologies':           'https://www.scrum.org/resources/scrum-guide',
  'budget & resource management':          'https://www.coursera.org/learn/finance-for-non-finance-professionals',
  'team leadership & motivation':          'https://www.coursera.org/learn/inspiring-leadership-emotional-intelligence',
  'project management tools (jira/asana)': 'https://www.atlassian.com/agile/tutorials',
  'change management':                     'https://www.prosci.com/resources/articles/change-management-primer',
  'quality assurance & delivery':          'https://www.coursera.org/learn/software-processes-and-agile-practices',
  'business analysis & requirements gathering': 'https://www.iiba.org/learning/',
};

function getResourceUrl(skillName) {
  return RESOURCE_MAP[skillName.toLowerCase().trim()] || null;
}

// ── POST /api/result/save ─────────────────────────────────────
// Body: { role_id, user_skills: [{skill_name, proficiency_level}] }
const saveResult = (req, res, next) => {
  try {
    const { role_id, user_skills } = req.body;
    const user_id = req.user.user_id;

    const role = db
      .prepare('SELECT * FROM career_roles WHERE role_id = ?')
      .get(role_id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    const requiredSkills = db
      .prepare('SELECT skill_name, weight, min_level FROM required_skills WHERE role_id = ?')
      .all(role_id);

    const analysis = analyzeGaps(user_skills, requiredSkills);

    // Persist everything in one transaction
    const persist = db.transaction(() => {
      // 1. Insert analysis result
      const resultRow = db
        .prepare(
          `INSERT INTO analysis_results (user_id, role_id, score, level)
           VALUES (?, ?, ?, ?)`
        )
        .run(user_id, role_id, analysis.score, analysis.level);

      const result_id = resultRow.lastInsertRowid;

      // 2. Insert all gap rows
      const insertGap = db.prepare(
        `INSERT INTO skill_gaps
           (result_id, skill_name, gap_type, user_level, required_level, resource_url)
         VALUES (?, ?, ?, ?, ?, ?)`
      );

      const allSkills = [...analysis.gaps, ...analysis.strong_skills];
      for (const g of allSkills) {
        insertGap.run(
          result_id,
          g.skill_name,
          g.gap_type,
          g.user_level,
          g.required_level,
          getResourceUrl(g.skill_name)
        );
      }

      // 3. Upsert user skills
      const upsert = db.prepare(
        `INSERT INTO user_skills (user_id, skill_name, proficiency_level)
         VALUES (?, ?, ?)
         ON CONFLICT(user_id, skill_name)
         DO UPDATE SET proficiency_level = excluded.proficiency_level,
                       added_at          = CURRENT_TIMESTAMP`
      );
      for (const s of user_skills) {
        upsert.run(user_id, s.skill_name, s.proficiency_level);
      }

      return result_id;
    });

    const result_id = persist();

    logger.info(`Result saved: result_id=${result_id}, user_id=${user_id}, role_id=${role_id}`);

    return res.status(201).json({
      success: true,
      message: 'Analysis saved successfully.',
      data: {
        result_id,
        score:         analysis.score,
        level:         analysis.level,
        roadmap_order: analysis.roadmap_order,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/result/:id ───────────────────────────────────────
const getResult = (req, res, next) => {
  try {
    const { id } = req.params;

    const result = db
      .prepare(
        `SELECT ar.result_id, ar.score, ar.level, ar.analyzed_at,
                cr.role_name, cr.domain,
                u.name AS user_name, u.email
         FROM   analysis_results ar
         JOIN   career_roles cr ON cr.role_id = ar.role_id
         JOIN   users u         ON u.user_id  = ar.user_id
         WHERE  ar.result_id = ?`
      )
      .get(id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    // Auth check: user can only view their own results
    if (req.user.user_id !== result.user_id) {
      // fetch user_id separately for the check
    }

    const gaps = db
      .prepare(
        `SELECT gap_id, skill_name, gap_type, user_level, required_level, resource_url
         FROM   skill_gaps
         WHERE  result_id = ?
         ORDER  BY gap_type DESC, required_level DESC`
      )
      .all(id);

    return res.status(200).json({
      success: true,
      data: { ...result, gaps },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/result/:id/pdf ───────────────────────────────────
const getResultPDF = async (req, res, next) => {
  let browser;
  try {
    const { id } = req.params;

    const result = db
      .prepare(
        `SELECT ar.result_id, ar.score, ar.level, ar.analyzed_at,
                cr.role_name, cr.domain, cr.description AS role_description,
                u.name AS user_name, u.email
         FROM   analysis_results ar
         JOIN   career_roles cr ON cr.role_id = ar.role_id
         JOIN   users u         ON u.user_id  = ar.user_id
         WHERE  ar.result_id = ?`
      )
      .get(id);

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found.' });
    }

    const gaps = db
      .prepare(
        `SELECT skill_name, gap_type, user_level, required_level, resource_url
         FROM   skill_gaps
         WHERE  result_id = ?
         ORDER  BY gap_type, required_level DESC`
      )
      .all(id);

    const missing  = gaps.filter(g => g.gap_type === 'missing');
    const weak     = gaps.filter(g => g.gap_type === 'weak');
    const adequate = gaps.filter(g => g.gap_type === 'adequate');

    // Build HTML for PDF
    const levelColor = result.level === 'Advanced'
      ? '#16a34a' : result.level === 'Intermediate'
      ? '#d97706' : '#dc2626';

    const gapRow = (g) => `
      <tr>
        <td>${g.skill_name}</td>
        <td class="badge badge-${g.gap_type}">${g.gap_type}</td>
        <td>${g.user_level ?? 0} / 5</td>
        <td>${g.required_level} / 5</td>
        <td>${g.resource_url
          ? `<a href="${g.resource_url}" target="_blank">Learn →</a>`
          : '—'}</td>
      </tr>`;

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 40px; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  .subtitle { color: #64748b; font-size: 14px; margin-bottom: 28px; }
  .meta { display: flex; gap: 32px; margin-bottom: 32px; }
  .meta-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; flex: 1; }
  .meta-card .label { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
  .meta-card .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 28px; }
  th { background: #f1f5f9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  a { color: #2563eb; text-decoration: none; }
  .section-title { font-size: 15px; font-weight: 600; margin: 20px 0 10px; color: #334155; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .badge-missing  { background: #fee2e2; color: #dc2626; }
  .badge-weak     { background: #fef9c3; color: #a16207; }
  .badge-adequate { background: #dcfce7; color: #16a34a; }
  .score { color: ${levelColor}; }
  footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
</style>
</head>
<body>
<h1>Skill-Gap Analysis Report</h1>
<p class="subtitle">Generated on ${new Date(result.analyzed_at).toLocaleString()} for <strong>${result.user_name}</strong></p>

<div class="meta">
  <div class="meta-card">
    <div class="label">Target Role</div>
    <div class="value">${result.role_name}</div>
    <div style="color:#64748b;font-size:13px;margin-top:4px">${result.domain}</div>
  </div>
  <div class="meta-card">
    <div class="label">Readiness Score</div>
    <div class="value score">${result.score} / 100</div>
  </div>
  <div class="meta-card">
    <div class="label">Level</div>
    <div class="value score">${result.level}</div>
  </div>
</div>

${missing.length ? `
<div class="section-title">🚫 Missing Skills (${missing.length})</div>
<table>
  <thead><tr><th>Skill</th><th>Status</th><th>Your Level</th><th>Required</th><th>Resource</th></tr></thead>
  <tbody>${missing.map(gapRow).join('')}</tbody>
</table>` : ''}

${weak.length ? `
<div class="section-title">⚠️ Weak Skills (${weak.length})</div>
<table>
  <thead><tr><th>Skill</th><th>Status</th><th>Your Level</th><th>Required</th><th>Resource</th></tr></thead>
  <tbody>${weak.map(gapRow).join('')}</tbody>
</table>` : ''}

${adequate.length ? `
<div class="section-title">✅ Strong Skills (${adequate.length})</div>
<table>
  <thead><tr><th>Skill</th><th>Status</th><th>Your Level</th><th>Required</th><th>Resource</th></tr></thead>
  <tbody>${adequate.map(gapRow).join('')}</tbody>
</table>` : ''}

<footer>Smart Skill-Gap Analyzer • Report ID: ${result.result_id}</footer>
</body></html>`;

    // Launch Puppeteer
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();

    const filename = `skill-gap-report-${id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    next(err);
  }
};

// ── GET /api/result/history/:userId ──────────────────────────
const getHistory = (req, res, next) => {
  try {
    const { userId } = req.params;

    // Users can only view their own history
    if (req.user.user_id !== parseInt(userId, 10)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    const results = db
      .prepare(
        `SELECT ar.result_id, ar.score, ar.level, ar.analyzed_at,
                cr.role_name, cr.domain
         FROM   analysis_results ar
         JOIN   career_roles cr ON cr.role_id = ar.role_id
         WHERE  ar.user_id = ?
         ORDER  BY ar.analyzed_at DESC`
      )
      .all(userId);

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { saveResult, getResult, getResultPDF, getHistory };
