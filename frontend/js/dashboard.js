// frontend/js/dashboard.js
'use strict';

const API_BASE = 'http://localhost:3000/api';

const LEVEL_NAMES  = ['', 'Novice', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
const ROLE_EMOJI   = {
  'Software Engineer':     '💻',
  'Data Scientist':        '🧠',
  'UI/UX Designer':        '🎨',
  'Cybersecurity Analyst': '🛡️',
  'Project Manager':       '📋',
};

const LEVEL_CONFIG = {
  'Beginner':     { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.2)',   label: 'Beginner'     },
  'Intermediate': { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  label: 'Intermediate' },
  'Advanced':     { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  label: 'Advanced'     },
  'Expert':       { color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  label: 'Expert'       },
};

// ── Helpers ───────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function levelBadge(level) {
  const lc = LEVEL_CONFIG[level] || LEVEL_CONFIG['Beginner'];
  return `<span class="level-badge" style="background:${lc.bg};color:${lc.color};border:1px solid ${lc.border}">${lc.label}</span>`;
}

function scoreColor(score) {
  if (score >= 75) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#f43f5e';
}

function gapStatusBadge(type) {
  const map = {
    missing:  { bg:'rgba(244,63,94,0.1)',  color:'#fb7185',  border:'rgba(244,63,94,0.18)',  label:'Missing' },
    weak:     { bg:'rgba(245,158,11,0.1)', color:'#fbbf24',  border:'rgba(245,158,11,0.18)', label:'Weak'    },
    adequate: { bg:'rgba(16,185,129,0.1)', color:'#34d399',  border:'rgba(16,185,129,0.18)', label:'Strong'  },
  };
  const c = map[type] || map.missing;
  return `<span class="gap-status-badge" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">${c.label}</span>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '—';
}

function setHTML(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val ?? '';
}

function showSkeleton(show) {
  document.querySelectorAll('.skeleton').forEach(el => {
    el.style.display = show ? '' : 'none';
  });
  document.querySelectorAll('.dash-content').forEach(el => {
    el.style.opacity = show ? '0' : '1';
  });
}

// ── Section: Profile card ─────────────────────────────────────
function populateProfile(profile, stats) {
  const name     = profile.name || 'User';
  const email    = profile.email || '';
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  setText('profileName',     name);
  setText('profileEmail',    email);
  setText('profileJoined',   'Joined ' + formatDate(profile.created_at));
  setText('statTotalAnalyses', stats.total_analyses ?? 0);
  setText('statBestScore',     stats.best_score      ?? 0);
  setText('statSkillsRecorded', stats.skills_recorded ?? 0);

  const avatarEl = document.getElementById('profileAvatar');
  if (avatarEl) avatarEl.textContent = initials;

  // Sidebar
  const sbAvatar = document.getElementById('sidebarAvatar');
  const sbName   = document.getElementById('sidebarName');
  const sbEmail  = document.getElementById('sidebarEmail');
  if (sbAvatar) sbAvatar.textContent = initials;
  if (sbName)   sbName.textContent   = name;
  if (sbEmail)  sbEmail.textContent  = email;
}

// ── Section: Latest result ────────────────────────────────────
function populateLatestResult(result) {
  if (!result) {
    setHTML('latestResultSection', `
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-title">No analyses yet</div>
        <div class="empty-sub">Run your first skill analysis to see your results here.</div>
        <a href="analyzer.html" class="btn btn-primary btn-sm" style="margin-top:16px">Start Analysis →</a>
      </div>`);
    return;
  }

  const lc = LEVEL_CONFIG[result.level] || LEVEL_CONFIG['Beginner'];
  setHTML('latestResultSection', `
    <div class="latest-result-inner dash-content">
      <div class="latest-result-top">
        <div>
          <div class="latest-role-emoji">${ROLE_EMOJI[result.role_name] || '💼'}</div>
          <div class="latest-role-name">${result.role_name}</div>
          <div class="latest-role-domain">${result.domain}</div>
        </div>
        <div class="latest-score-wrap">
          <div class="latest-score" style="color:${scoreColor(result.score)}">${result.score}</div>
          <div class="latest-score-label">/ 100</div>
        </div>
      </div>
      <div class="latest-meta">
        <span class="level-badge" style="background:${lc.bg};color:${lc.color};border:1px solid ${lc.border}">${result.level}</span>
        <span class="latest-date">${formatDate(result.analyzed_at)}</span>
      </div>
      <div class="latest-progress-bar">
        <div class="latest-progress-fill" style="width:${result.score}%;background:${scoreColor(result.score)}"></div>
      </div>
    </div>
  `);
}

// ── Section: Skills gap table ─────────────────────────────────
function populateGapTable(gaps) {
  const tbody = document.getElementById('gapTableBody');
  if (!tbody) return;

  if (!gaps || gaps.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty">No gap data available. Run an analysis first.</td></tr>`;
    return;
  }

  tbody.innerHTML = gaps.map(g => {
    const userLvl = g.user_level  ?? 0;
    const reqLvl  = g.required_level ?? 0;
    const gapAmt  = Math.max(0, reqLvl - userLvl);
    const gapDisplay = gapAmt === 0
      ? '<span style="color:var(--accent-light)">+0 ✓</span>'
      : `<span style="color:${gapAmt >= 3 ? '#f43f5e' : '#f59e0b'}">−${gapAmt}</span>`;

    return `
      <tr class="gap-table-row">
        <td class="skill-name-cell">${g.skill_name}</td>
        <td class="level-cell">
          <div class="level-pill-wrap">
            <div class="level-mini-bar">
              <div class="level-mini-fill" style="width:${(userLvl/5)*100}%;background:${scoreColor((userLvl/5)*100)}"></div>
            </div>
            <span>${userLvl}/5</span>
          </div>
        </td>
        <td class="level-cell">
          <div class="level-pill-wrap">
            <div class="level-mini-bar">
              <div class="level-mini-fill" style="width:${(reqLvl/5)*100}%;background:var(--primary-light)"></div>
            </div>
            <span>${reqLvl}/5</span>
          </div>
        </td>
        <td class="gap-cell">${gapDisplay}</td>
        <td>${gapStatusBadge(g.gap_type)}</td>
      </tr>
    `;
  }).join('');
}

// ── Section: History list ─────────────────────────────────────
function populateHistory(results) {
  const list = document.getElementById('historyList');
  if (!list) return;

  if (!results || results.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📁</div><div class="empty-title">No history yet</div></div>`;
    return;
  }

  list.innerHTML = results.map((r, idx) => {
    const lc = LEVEL_CONFIG[r.level] || LEVEL_CONFIG['Beginner'];
    return `
      <div class="history-row dash-content" style="animation-delay:${idx * 0.07}s" data-result-id="${r.result_id}">
        <div class="history-rank">#${idx + 1}</div>
        <div class="history-role">
          <span class="history-role-emoji">${ROLE_EMOJI[r.role_name] || '💼'}</span>
          <div>
            <div class="history-role-name">${r.role_name}</div>
            <div class="history-date">${formatDate(r.analyzed_at)}</div>
          </div>
        </div>
        <div class="history-score" style="color:${scoreColor(r.score)}">${r.score}</div>
        <span class="level-badge" style="background:${lc.bg};color:${lc.color};border:1px solid ${lc.border}">${r.level}</span>
        <a href="result.html" class="history-view-btn" title="View">→</a>
      </div>
    `;
  }).join('');
}

// ── Charts ────────────────────────────────────────────────────
async function renderCharts(dashData) {
  const { recent_results, latest_gaps } = dashData;

  // Radar chart — user vs required for latest result gaps
  if (latest_gaps && latest_gaps.length > 0) {
    const labels   = latest_gaps.map(g => g.skill_name);
    const userData = latest_gaps.map(g => g.user_level  ?? 0);
    const reqData  = latest_gaps.map(g => g.required_level ?? 0);
    Charts.renderRadarChart('radarChart', labels, userData, reqData);
  } else {
    const radarWrap = document.getElementById('radarChartWrap');
    if (radarWrap) radarWrap.innerHTML = `<div class="chart-empty">Run an analysis to see your skill radar.</div>`;
  }

  // Bar chart — last 5 scores
  if (recent_results && recent_results.length > 0) {
    const reversed = [...recent_results].reverse();
    const labels   = reversed.map(r => r.role_name);
    const scores   = reversed.map(r => r.score);
    Charts.renderBarChart('barChart', labels, scores);

    // Sparkline in stat card
    Charts.renderSparkline('sparklineChart', scores);
  } else {
    const barWrap = document.getElementById('barChartWrap');
    if (barWrap) barWrap.innerHTML = `<div class="chart-empty">Complete analyses to see score history.</div>`;
  }
}

// ── Main load ─────────────────────────────────────────────────
async function loadDashboard() {
  if (!Auth.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  const userId = Auth.getUserId();
  if (!userId) {
    Auth.logout();
    return;
  }

  try {
    const res  = await Auth.authFetch(`${API_BASE}/dashboard/${userId}`);
    const data = await res.json();

    if (!data.success) throw new Error(data.message || 'Failed to load dashboard');

    const { profile, stats, recent_results, latest_gaps } = data.data;

    populateProfile(profile, stats);
    populateLatestResult(recent_results?.[0] || null);
    populateGapTable(latest_gaps);
    populateHistory(recent_results);

    // Render charts after DOM is ready
    requestAnimationFrame(() => renderCharts(data.data));

    // Hide loading skeletons
    showSkeleton(false);

    // Fade in all content
    document.querySelectorAll('.dash-content').forEach((el, i) => {
      el.style.transition = `opacity 0.4s ease ${i * 0.05}s, transform 0.4s ease ${i * 0.05}s`;
      el.style.transform  = 'translateY(0)';
    });

  } catch (err) {
    console.error('Dashboard load error:', err);
    const errBanner = document.getElementById('dashErrorBanner');
    if (errBanner) {
      errBanner.textContent = `Failed to load dashboard: ${err.message}`;
      errBanner.style.display = 'block';
    }
    showSkeleton(false);
  }
}

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Logout handler
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.clearToken();
    window.location.href = '../index.html';
  });

  // Mobile sidebar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('visible');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('visible');
  });

  loadDashboard();
});

window.Dashboard = { loadDashboard };
