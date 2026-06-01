// frontend/js/auth.js
'use strict';

const API_BASE = 'https://smart-skill-gap-analyzer.up.railway.app/api';

// ── Token & user storage ──────────────────────────────────────
const TOKEN_KEY   = 'sga_token';
const USERID_KEY  = 'sga_user_id';
const USERNAME_KEY = 'sga_user_name';
const EMAIL_KEY   = 'sga_user_email';

function getToken()            { return localStorage.getItem(TOKEN_KEY); }
function setToken(token)       { localStorage.setItem(TOKEN_KEY, token); }
function clearToken()          { localStorage.removeItem(TOKEN_KEY); }

function getUserId()           { return localStorage.getItem(USERID_KEY); }
function setUserId(id)         { localStorage.setItem(USERID_KEY, id); }

function getUserName()         { return localStorage.getItem(USERNAME_KEY); }
function setUserName(name)     { localStorage.setItem(USERNAME_KEY, name); }

function getUserEmail()        { return localStorage.getItem(EMAIL_KEY); }
function setUserEmail(email)   { localStorage.setItem(EMAIL_KEY, email); }

function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode JWT payload (no verification — server handles that)
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Check expiry
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERID_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EMAIL_KEY);
  window.location.href = '/pages/login.html';
}

// ── Authenticated fetch wrapper ───────────────────────────────
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please log in again.');
  }
  return res;
}

// ── Auth API calls ────────────────────────────────────────────
async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed.');

  setToken(data.data.token);
  setUserId(data.data.user.user_id);
  setUserName(data.data.user.name);
  setUserEmail(data.data.user.email);
  return data;
}

async function register(name, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed.');

  setToken(data.data.token);
  setUserId(data.data.user.user_id);
  setUserName(data.data.user.name);
  setUserEmail(data.data.user.email);
  return data;
}

// ── Guard: redirect to login if not authenticated ─────────────
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/pages/login.html';
  }
}

// ── Guard: redirect away if already logged in ─────────────────
function redirectIfAuth(destination = '/pages/dashboard.html') {
  if (isAuthenticated()) {
    window.location.href = destination;
  }
}

// Export for non-module scripts via window
window.Auth = {
  API_BASE,
  login, register, logout,
  getToken, setToken, clearToken,
  getUserId, setUserId,
  getUserName, getUserEmail,
  isAuthenticated,
  requireAuth, redirectIfAuth,
  authFetch,
};
