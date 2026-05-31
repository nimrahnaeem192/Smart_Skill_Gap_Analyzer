// frontend/js/analyzer.js
'use strict';

const ANALYZER_API_BASE = 'http://localhost:3000/api';
const LEVEL_NAMES = ['', 'Novice', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
const ROLE_EMOJI = {
  'Software Engineer': '💻',
  'Data Scientist': '🧠',
  'UI/UX Designer': '🎨',
  'Cybersecurity Analyst': '🛡️',
  'Project Manager': '📋',
};

async function fetchRoles() {
  const res = await Auth.authFetch(`${ANALYZER_API_BASE}/roles`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function fetchSkillsForRole(roleId) {
  const res = await Auth.authFetch(`${ANALYZER_API_BASE}/roles/${roleId}/skills`);
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function submitAnalysis(roleId, userSkills) {
  const res = await Auth.authFetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId, user_skills: userSkills }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function saveResult(roleId, userSkills) {
  const res = await Auth.authFetch(`${API_BASE}/result/save`, {
    method: 'POST',
    body: JSON.stringify({ role_id: roleId, user_skills: userSkills }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

function exportPDF(resultId) {
  window.open(`${API_BASE}/result/${resultId}/pdf`, '_blank');
}

function saveAnalysisResult(data) { sessionStorage.setItem('analysisResult', JSON.stringify(data)); }
function loadAnalysisResult() { const r = sessionStorage.getItem('analysisResult'); return r ? JSON.parse(r) : null; }
function saveResultId(id) { sessionStorage.setItem('savedResultId', id); }
function loadResultId() { return sessionStorage.getItem('savedResultId'); }

function buildSkillForm(skills, container) {
  container.innerHTML = '';
  skills.forEach(skill => {
    const row = document.createElement('div');
    row.className = 'skill-row';
    row.dataset.skillName = skill.skill_name;
    row.dataset.required = skill.min_level;
    row.innerHTML = `
      <div class="skill-row-info">
        <div class="skill-row-name">${skill.skill_name}</div>
        <div class="skill-row-meta">
          <span class="skill-required">Required: <strong>${LEVEL_NAMES[skill.min_level]}</strong></span>
          <span class="skill-weight-badge">×${skill.weight}</span>
        </div>
      </div>
      <div class="skill-row-controls">
        <div class="slider-wrap">
          <input type="range" class="skill-slider" min="0" max="5" value="0" data-skill="${skill.skill_name}"/>
        </div>
        <div class="level-display">
          <span class="level-num">0</span>
          <span class="level-name" style="color:var(--text-dim)">Not rated</span>
        </div>
      </div>`;
    const slider = row.querySelector('.skill-slider');
    const levelNum = row.querySelector('.level-num');
    const levelName = row.querySelector('.level-name');
    slider.addEventListener('input', () => {
      const val = parseInt(slider.value);
      slider.style.setProperty('--pct', (val/5*100)+'%');
      levelNum.textContent = val;
      levelName.textContent = val === 0 ? 'Not rated' : LEVEL_NAMES[val];
    });
    container.appendChild(row);
  });
}

function addCustomSkillRow(container) {
  const row = document.createElement('div');
  row.className = 'skill-row skill-row-custom';
  row.innerHTML = `
    <div class="skill-row-info">
      <input type="text" class="form-input custom-skill-name" placeholder="Skill name"/>
    </div>
    <div class="skill-row-controls">
      <div class="slider-wrap">
        <input type="range" class="skill-slider" min="0" max="5" value="0"/>
      </div>
      <div class="level-display">
        <span class="level-num">0</span>
        <span class="level-name" style="color:var(--text-dim)">Not rated</span>
      </div>
    </div>
    <button class="remove-custom-btn" title="Remove">✕</button>`;
  const slider = row.querySelector('.skill-slider');
  const levelNum = row.querySelector('.level-num');
  const levelName = row.querySelector('.level-name');
  slider.addEventListener('input', () => {
    const val = parseInt(slider.value);
    levelNum.textContent = val;
    levelName.textContent = val === 0 ? 'Not rated' : LEVEL_NAMES[val];
  });
  row.querySelector('.remove-custom-btn').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function collectSkillInputs(container) {
  const skills = [];
  container.querySelectorAll('.skill-row').forEach(row => {
    const level = parseInt(row.querySelector('.skill-slider').value);
    if (level === 0) return;
    let name;
    if (row.classList.contains('skill-row-custom')) {
      name = row.querySelector('.custom-skill-name')?.value.trim();
      if (!name) return;
    } else {
      name = row.dataset.skillName;
    }
    skills.push({ skill_name: name, proficiency_level: level });
  });
  return skills;
}

function renderGauge(score, canvasEl, labelEl) {
  const color = score >= 75 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  let current = 0;
  const step = score / 60;
  const tick = () => {
    current = Math.min(current + step, score);
    canvasEl.style.background = `conic-gradient(${color} ${(current/100*360)}deg, rgba(255,255,255,0.06) ${(current/100*360)}deg)`;
    if (labelEl) labelEl.textContent = Math.round(current);
    if (current < score) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderGaps(data, container) {
  const { gaps, strong_skills } = data;
  container.innerHTML = '';
  const missing = (gaps||[]).filter(g => g.gap_type === 'missing');
  const weak = (gaps||[]).filter(g => g.gap_type === 'weak');
  const adequate = strong_skills || [];
  if (missing.length) container.appendChild(buildGapSection('🚫 Missing Skills', missing, 'missing'));
  if (weak.length) container.appendChild(buildGapSection('⚠️ Weak Skills', weak, 'weak'));
  if (adequate.length) container.appendChild(buildGapSection('✅ Strong Skills', adequate, 'adequate'));
}

function buildGapSection(title, items, type) {
  const section = document.createElement('div');
  section.className = 'gap-section';
  section.innerHTML = `<div class="gap-section-header"><span class="gap-section-title">${title}</span><span class="gap-section-count">${items.length}</span></div><div class="gap-cards-grid"></div>`;
  const grid = section.querySelector('.gap-cards-grid');
  items.forEach(g => {
    const card = document.createElement('div');
    card.className = `gap-card gap-${type}`;
    const userLvl = g.user_level ?? 0;
    card.innerHTML = `
      <div class="gap-card-top">
        <span class="gap-card-name">${g.skill_name}</span>
        <span class="badge badge-${type}">${type}</span>
      </div>
      <div class="gap-card-levels">
        <div class="level-bar-mini"><div class="level-bar-fill" style="width:${(userLvl/5)*100}%"></div></div>
        <span class="gap-level-text">${userLvl}/5 → ${g.required_level}/5</span>
      </div>
      ${g.resource_url ? `<a href="${g.resource_url}" target="_blank" class="gap-resource-link">Learn →</a>` : ''}`;
    grid.appendChild(card);
  });
  return section;
}

function renderRoadmap(data, container, resultId) {
  const allGaps = [...(data.gaps||[])].filter(g => g.gap_type !== 'adequate');
  allGaps.sort((a,b) => (b.weight||0)-(a.weight||0));
  const storageKey = `roadmap_progress_${resultId||'draft'}`;
  const savedChecks = JSON.parse(localStorage.getItem(storageKey)||'{}');
  container.innerHTML = '';
  const times = { missing: ['4–8 weeks','6–10 weeks','8–12 weeks'], weak: ['1–2 weeks','2–4 weeks','3–6 weeks'] };
  allGaps.forEach((g, idx) => {
    const done = savedChecks[g.skill_name] === true;
    const item = document.createElement('div');
    item.className = `roadmap-step ${done ? 'roadmap-step-done' : ''}`;
    const arr = times[g.gap_type] || times.missing;
    const estTime = arr[Math.min((g.required_level-(g.user_level||0))-1, arr.length-1)] || '2–4 weeks';
    item.innerHTML = `
      <div class="roadmap-step-num">${idx+1}</div>
      <div class="roadmap-step-body">
        <div class="roadmap-step-top">
          <div class="roadmap-step-name">${g.skill_name}</div>
          <div class="roadmap-step-meta">
            <span class="roadmap-type-pill">${g.gap_type === 'missing' ? '🚫 Missing' : '⚠️ Weak'}</span>
            <span class="roadmap-time">⏱ ${estTime}</span>
          </div>
        </div>
        ${g.resource_url ? `<a href="${g.resource_url}" target="_blank" class="roadmap-resource"><span>🎓</span> Free Course</a>` : ''}
      </div>
      <label class="roadmap-check">
        <input type="checkbox" class="roadmap-checkbox" ${done ? 'checked' : ''}/>
        <div class="roadmap-check-box">${done ? '✓' : ''}</div>
      </label>`;
    const cb = item.querySelector('.roadmap-checkbox');
    const cbBox = item.querySelector('.roadmap-check-box');
    cb.addEventListener('change', () => {
      item.classList.toggle('roadmap-step-done', cb.checked);
      cbBox.textContent = cb.checked ? '✓' : '';
      savedChecks[g.skill_name] = cb.checked;
      localStorage.setItem(storageKey, JSON.stringify(savedChecks));
      updateProgress();
    });
    container.appendChild(item);
  });
  function updateProgress() {
    const total = allGaps.length;
    const done = Object.values(JSON.parse(localStorage.getItem(storageKey)||'{}')).filter(Boolean).length;
    const pct = total ? Math.round((done/total)*100) : 0;
    const bar = document.getElementById('roadmapProgressBar');
    const txt = document.getElementById('roadmapProgressText');
    if (bar) bar.style.width = pct+'%';
    if (txt) txt.textContent = `${done} of ${total} steps completed`;
  }
  updateProgress();
  return allGaps.length;
}

window.Analyzer = {
  fetchRoles, fetchSkillsForRole, buildSkillForm, addCustomSkillRow,
  collectSkillInputs, submitAnalysis, saveResult, exportPDF,
  renderGauge, renderGaps, renderRoadmap,
  saveAnalysisResult, loadAnalysisResult, saveResultId, loadResultId,
  LEVEL_NAMES, ROLE_EMOJI,
};