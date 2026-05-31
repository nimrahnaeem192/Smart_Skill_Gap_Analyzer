// frontend/js/charts.js
'use strict';

// ── Theme tokens (keep in sync with CSS custom properties) ────
const CHART_THEME = {
  primary:       '#6366f1',
  primaryLight:  '#818cf8',
  primaryDark:   '#4f46e5',
  accent:        '#10b981',
  accentLight:   '#34d399',
  warning:       '#f59e0b',
  danger:        '#f43f5e',
  surface:       '#111827',
  surface2:      '#1a2235',
  surface3:      '#212d42',
  text:          '#f1f5f9',
  textMuted:     '#94a3b8',
  textDim:       '#64748b',
  border:        'rgba(255,255,255,0.06)',
  fontDisplay:   "'Syne', sans-serif",
  fontBody:      "'DM Sans', sans-serif",
};

// ── Global Chart.js defaults ──────────────────────────────────
function applyChartDefaults() {
  if (!window.Chart) return;
  Chart.defaults.color          = CHART_THEME.textMuted;
  Chart.defaults.font.family    = CHART_THEME.fontBody;
  Chart.defaults.font.size      = 12;
  Chart.defaults.borderColor    = CHART_THEME.border;
  Chart.defaults.plugins.legend.labels.color = CHART_THEME.textMuted;
  Chart.defaults.plugins.legend.labels.font  = { family: CHART_THEME.fontDisplay, weight: '600' };
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(17,24,39,0.95)';
  Chart.defaults.plugins.tooltip.borderColor      = 'rgba(99,102,241,0.3)';
  Chart.defaults.plugins.tooltip.borderWidth      = 1;
  Chart.defaults.plugins.tooltip.titleFont        = { family: CHART_THEME.fontDisplay, weight: '700', size: 13 };
  Chart.defaults.plugins.tooltip.bodyFont         = { family: CHART_THEME.fontBody, size: 12 };
  Chart.defaults.plugins.tooltip.padding          = 12;
  Chart.defaults.plugins.tooltip.cornerRadius     = 10;
}

// ── Instance registry (to destroy before re-render) ───────────
const _chartInstances = {};

function destroyChart(canvasId) {
  if (_chartInstances[canvasId]) {
    _chartInstances[canvasId].destroy();
    delete _chartInstances[canvasId];
  }
}

// ── Radar Chart ───────────────────────────────────────────────
/**
 * @param {string}   canvasId      - canvas element id
 * @param {string[]} labels        - skill names
 * @param {number[]} userData      - user proficiency per skill (0–5)
 * @param {number[]} requiredData  - required level per skill (0–5)
 */
function renderRadarChart(canvasId, labels, userData, requiredData) {
  applyChartDefaults();
  destroyChart(canvasId);

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  // Truncate long labels for radar legibility
  const shortLabels = labels.map(l =>
    l.length > 18 ? l.slice(0, 16) + '…' : l
  );

  const chart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: shortLabels,
      datasets: [
        {
          label: 'Your Level',
          data:  userData,
          backgroundColor: 'rgba(99,102,241,0.15)',
          borderColor:     CHART_THEME.primary,
          borderWidth:     2,
          pointBackgroundColor: CHART_THEME.primaryLight,
          pointBorderColor:    'rgba(8,11,20,0.8)',
          pointBorderWidth:    2,
          pointRadius:         5,
          pointHoverRadius:    7,
          pointHoverBackgroundColor: CHART_THEME.primaryLight,
        },
        {
          label: 'Required Level',
          data:  requiredData,
          backgroundColor: 'rgba(16,185,129,0.08)',
          borderColor:     CHART_THEME.accent,
          borderWidth:     2,
          borderDash:      [5, 4],
          pointBackgroundColor: CHART_THEME.accentLight,
          pointBorderColor:    'rgba(8,11,20,0.8)',
          pointBorderWidth:    2,
          pointRadius:         4,
          pointHoverRadius:    6,
        },
      ],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      animation: {
        duration: 900,
        easing:   'easeInOutQuart',
      },
      scales: {
        r: {
          min: 0,
          max: 5,
          ticks: {
            stepSize:        1,
            color:           CHART_THEME.textDim,
            backdropColor:   'transparent',
            font:            { size: 10, family: CHART_THEME.fontDisplay },
            callback: v => v === 0 ? '' : v,
          },
          pointLabels: {
            color:      CHART_THEME.textMuted,
            font:       { size: 11, family: CHART_THEME.fontDisplay, weight: '600' },
            padding:    12,
          },
          grid: {
            color:       'rgba(255,255,255,0.06)',
            circular:    false,
          },
          angleLines: {
            color: 'rgba(255,255,255,0.05)',
          },
        },
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels:   { padding: 20, boxWidth: 12, boxHeight: 12, usePointStyle: true },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const lvlNames = ['', 'Novice', 'Basic', 'Intermediate', 'Proficient', 'Expert'];
              const v = ctx.raw;
              return ` ${ctx.dataset.label}: ${v} (${lvlNames[v] || 'Not rated'})`;
            },
          },
        },
      },
    },
  });

  _chartInstances[canvasId] = chart;
  return chart;
}

// ── Bar Chart ─────────────────────────────────────────────────
/**
 * @param {string}   canvasId  - canvas element id
 * @param {string[]} labels    - role names or dates
 * @param {number[]} scores    - readiness scores (0–100)
 * @param {string[]} [levels]  - optional level per bar for coloring
 */
function renderBarChart(canvasId, labels, scores, levels = []) {
  applyChartDefaults();
  destroyChart(canvasId);

  const ctx = document.getElementById(canvasId);
  if (!ctx) return;

  // Color each bar by level
  function barColor(score) {
    if (score >= 75) return CHART_THEME.accent;
    if (score >= 40) return CHART_THEME.warning;
    return CHART_THEME.danger;
  }

  function barAlpha(score) {
    if (score >= 75) return 'rgba(16,185,129,0.15)';
    if (score >= 40) return 'rgba(245,158,11,0.15)';
    return 'rgba(244,63,94,0.15)';
  }

  const bgColors     = scores.map(s => barAlpha(s));
  const borderColors = scores.map(s => barColor(s));

  // Short labels
  const shortLabels = labels.map(l =>
    l.length > 16 ? l.slice(0, 14) + '…' : l
  );

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: shortLabels,
      datasets: [{
        label:           'Readiness Score',
        data:            scores,
        backgroundColor: bgColors,
        borderColor:     borderColors,
        borderWidth:     1.5,
        borderRadius:    8,
        borderSkipped:   false,
        hoverBackgroundColor: scores.map(s => barColor(s) + '33'),
        hoverBorderColor:     borderColors,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing:   'easeOutQuart',
        delay:    (ctx) => ctx.dataIndex * 80,
      },
      scales: {
        x: {
          grid:   { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          border: { display: false },
          ticks:  {
            color:   CHART_THEME.textDim,
            font:    { size: 11, family: CHART_THEME.fontDisplay, weight: '600' },
            maxRotation: 30,
          },
        },
        y: {
          min:  0,
          max:  100,
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          border:{ display: false },
          ticks: {
            color:    CHART_THEME.textDim,
            font:     { size: 11, family: CHART_THEME.fontBody },
            callback: v => v + '%',
            stepSize: 25,
          },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: items => labels[items[0].dataIndex],
            label: ctx  => {
              const s = ctx.raw;
              const lvl = s >= 75 ? 'Advanced' : s >= 40 ? 'Intermediate' : 'Beginner';
              return [`  Score: ${s} / 100`, `  Level: ${lvl}`];
            },
          },
        },
        // Reference lines at 40 and 75
        annotation: undefined,
      },
    },
    plugins: [{
      id: 'referenceLines',
      afterDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        [[40, CHART_THEME.warning, 'Intermediate'], [75, CHART_THEME.accent, 'Advanced']].forEach(([val, color, lbl]) => {
          const yPos = y.getPixelForValue(val);
          ctx.save();
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = color + '55';
          ctx.lineWidth   = 1;
          ctx.moveTo(left, yPos);
          ctx.lineTo(right, yPos);
          ctx.stroke();
          ctx.fillStyle  = color + '99';
          ctx.font       = `600 10px ${CHART_THEME.fontDisplay}`;
          ctx.textAlign  = 'right';
          ctx.fillText(lbl, right - 4, yPos - 4);
          ctx.restore();
        });
      },
    }],
  });

  _chartInstances[canvasId] = chart;
  return chart;
}

// ── Mini sparkline (bonus) ────────────────────────────────────
function renderSparkline(canvasId, scores) {
  applyChartDefaults();
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if (!ctx || !scores.length) return;

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels:   scores.map((_, i) => `#${i+1}`),
      datasets: [{
        data:            scores,
        borderColor:     CHART_THEME.primary,
        borderWidth:     2,
        pointRadius:     3,
        pointBackgroundColor: CHART_THEME.primaryLight,
        fill:            true,
        backgroundColor: (ctx) => {
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 60);
          g.addColorStop(0, 'rgba(99,102,241,0.25)');
          g.addColorStop(1, 'rgba(99,102,241,0)');
          return g;
        },
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 600 },
      scales:  { x: { display: false }, y: { display: false, min: 0, max: 100 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });

  _chartInstances[canvasId] = chart;
  return chart;
}

// Export
window.Charts = { renderRadarChart, renderBarChart, renderSparkline, CHART_THEME };
