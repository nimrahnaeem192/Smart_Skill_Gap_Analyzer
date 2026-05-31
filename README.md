# ⚡ Smart Skill-Gap Analyzer

> **Know your gaps. Build your future.**
> A full-stack career intelligence tool that maps your skills against any target role, calculates a weighted readiness score, identifies gaps, and generates a prioritized free-course learning roadmap.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Database Setup](#3-database-setup)
4. [Environment Configuration](#4-environment-configuration)
5. [Running the App](#5-running-the-app)
6. [Opening the Frontend](#6-opening-the-frontend)
7. [Project Structure](#7-project-structure)
8. [API Endpoints](#8-api-endpoints)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | 18 or higher | [Download at nodejs.org](https://nodejs.org) |
| **npm** | 9 or higher | Comes bundled with Node.js |
| **Git** | Any | Optional — for cloning |

> ✅ **No database server needed.** The app uses `better-sqlite3`, which creates a single local `.db` file automatically. No PostgreSQL, MySQL, or SQL Server required.

---

## 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/skill-gap-analyzer.git
cd skill-gap-analyzer

# Install backend dependencies
cd backend
npm install
```

> **Windows note:** If `npm install` fails for `better-sqlite3`, install build tools first:
> ```cmd
> npm install --global windows-build-tools
> ```
> Or install Visual Studio Build Tools from [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/).

---

## 3. Database Setup

Run this **once** from the `backend/` folder to create and seed the database:

```bash
npm run init-db
```

This command:
- Creates `database/skillgap.db` automatically (SQLite file, no server needed)
- Runs `database/schema.sql` — creates all 6 tables with constraints
- Runs `database/seed.sql` — inserts 5 career roles and 50 required skills
- Skips re-seeding if the database already exists

**Expected output:**
```
══════════════════════════════════════════════
  Smart Skill-Gap Analyzer — DB Initialiser
══════════════════════════════════════════════
  DB path : ...\database\skillgap.db
  Status  : no database found — creating fresh.

[1/2] Schema
  ✔  schema.sql applied.

[2/2] Seed data
  ✔  seed.sql applied.
  ✔  Inserted 5 career roles.
  ✔  Inserted 50 required skills.

══════════════════════════════════════════════
  Database initialized successfully ✓
══════════════════════════════════════════════
```

---

## 4. Environment Configuration

Copy the example file and set your values:

**Windows (Command Prompt):**
```cmd
copy .env.example .env
notepad .env
```

**Mac / Linux:**
```bash
cp .env.example .env
nano .env
```

Edit `.env` with these values:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=YourRandomSecretKeyHere_MakeItLong!
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
```

> **Important:** Set `JWT_SECRET` to any long random string (20+ characters). This signs and verifies all user tokens. Never commit this file to git.

---

## 5. Running the App

From the `backend/` folder:

```bash
# Development mode (auto-restarts on file changes)
npm run dev

# Production mode
npm start
```

**Expected output:**
```
11:14:20 [info]: Database connected: ...\database\skillgap.db
11:14:20 [info]: 🚀 Smart Skill-Gap Analyzer API running on port 3000
11:14:20 [info]:    Environment : development
11:14:20 [info]:    Health check: http://localhost:3000/api/health
```

Verify it's working: open [http://localhost:3000/api/health](http://localhost:3000/api/health) in your browser. You should see:

```json
{ "success": true, "status": "ok", "uptime": 3.2 }
```

---

## 6. Opening the Frontend

The frontend is pure HTML/CSS/JS — no build step needed.

**Option A — Direct file open:**
Navigate to `frontend/` and double-click `index.html`.

> ⚠️ Some browsers block `fetch()` requests from `file://` URLs. If login/register don't work, use Option B.

**Option B — VS Code Live Server (recommended):**
1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) in VS Code
2. Right-click `frontend/index.html` → **Open with Live Server**
3. Browser opens at `http://127.0.0.1:5500`

**Option C — Python quick server:**
```bash
cd frontend
python -m http.server 5500
# Open http://localhost:5500
```

**Page flow:**
```
index.html → pages/register.html → pages/analyzer.html
                                  → pages/result.html
                                  → pages/roadmap.html
                                  → pages/dashboard.html
```

---

## 7. Project Structure

```
Skill_Gap_Analyzer/
│
├── database/                        # SQLite database layer
│   ├── schema.sql                   # CREATE TABLE statements (6 tables)
│   ├── seed.sql                     # 5 career roles + 50 required skills
│   ├── init.js                      # Database initialiser script
│   └── skillgap.db                  # Generated SQLite file (git-ignored)
│
├── backend/                         # Node.js + Express API
│   ├── server.js                    # App entry point, middleware, route mounting
│   ├── .env                         # Environment variables (git-ignored)
│   ├── .env.example                 # Template for .env
│   ├── package.json
│   │
│   ├── db/
│   │   └── db.js                    # better-sqlite3 connection singleton
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT Bearer token verification
│   │   ├── errorHandler.js          # Global Express error handler
│   │   └── validateRequest.js       # express-validator error formatter
│   │
│   ├── services/
│   │   ├── gapAnalyzer.js           # Core analysis engine (weighted scoring)
│   │   └── logger.js                # Winston logger (console + file)
│   │
│   ├── routes/
│   │   ├── auth.js                  # /api/auth/*
│   │   ├── roles.js                 # /api/roles/*
│   │   ├── analyze.js               # /api/analyze
│   │   ├── result.js                # /api/result/*
│   │   └── dashboard.js             # /api/dashboard/*
│   │
│   ├── controllers/
│   │   ├── authController.js        # register, login
│   │   ├── rolesController.js       # getAllRoles, getRoleSkills
│   │   ├── analyzeController.js     # analyze
│   │   ├── resultController.js      # saveResult, getResult, PDF, history
│   │   └── dashboardController.js   # getDashboard
│   │
│   └── logs/                        # Winston log files (git-ignored)
│       ├── combined.log
│       └── error.log
│
└── frontend/                        # Pure HTML/CSS/JS — no build step
    ├── index.html                   # Landing page
    │
    ├── css/
    │   ├── styles.css               # Design system, tokens, components
    │   └── dashboard.css            # Dashboard layout + sidebar
    │
    ├── js/
    │   ├── auth.js                  # Token storage, login/register, authFetch
    │   ├── analyzer.js              # Analysis logic, gap renderer, roadmap
    │   ├── dashboard.js             # Dashboard data fetching & DOM population
    │   └── charts.js                # Chart.js radar + bar + sparkline
    │
    └── pages/
        ├── login.html               # Login form
        ├── register.html            # Registration form with password strength
        ├── analyzer.html            # 3-step skill analysis wizard
        ├── result.html              # Results: gauge, gap cards, save, PDF
        ├── roadmap.html             # Prioritized learning roadmap + checkboxes
        └── dashboard.html           # Main dashboard with charts
```

---

## 8. API Endpoints

All endpoints are prefixed with `http://localhost:3000`.

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account. Returns JWT. |
| `POST` | `/api/auth/login` | — | Login. Returns JWT. |

**Register body:**
```json
{ "name": "Jane Smith", "email": "jane@example.com", "password": "Secret123" }
```

**Login body:**
```json
{ "email": "jane@example.com", "password": "Secret123" }
```

---

### Roles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/roles` | — | List all 5 career roles |
| `GET` | `/api/roles/:id/skills` | — | Required skills for a role |

---

### Analysis

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/analyze` | ✅ Bearer | Run gap analysis (in-memory, not saved) |

**Body:**
```json
{
  "role_id": 1,
  "user_skills": [
    { "skill_name": "Python or JavaScript", "proficiency_level": 3 },
    { "skill_name": "Version Control (Git)", "proficiency_level": 4 }
  ]
}
```

**Response includes:** `score` (0–100), `level`, `gaps[]`, `strong_skills[]`, `roadmap_order[]`

---

### Results

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/result/save` | ✅ Bearer | Save analysis to database |
| `GET` | `/api/result/:id` | ✅ Bearer | Fetch saved result with gaps |
| `GET` | `/api/result/:id/pdf` | ✅ Bearer | Download PDF report |
| `GET` | `/api/result/history/:userId` | ✅ Bearer | All past analyses for a user |

---

### Dashboard

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/:userId` | ✅ Bearer | Profile + last 5 results + latest gaps |

---

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | — | Server status + uptime |

---

### Score Formula

```
score = SUM[ min(user_level / min_level, 1) × weight ]  for each skill
```

- Each skill's weight contributes up to its full `weight` value
- Weights per role sum to exactly **100**
- Score is capped at **100**
- Levels: `< 40` = Beginner · `40–74` = Intermediate · `≥ 75` = Advanced

---

## 9. Troubleshooting

### ❌ `Error: listen EADDRINUSE :::3000` — Port already in use

Another process is using port 3000. Either:

**Kill the process (Windows):**
```cmd
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Kill the process (Mac/Linux):**
```bash
lsof -ti:3000 | xargs kill -9
```

**Or change the port** in `backend/.env`:
```env
PORT=3001
```
Then update `API_BASE` in `frontend/js/auth.js` and `frontend/js/analyzer.js`:
```js
const API_BASE = 'http://localhost:3001/api';
```

---

### ❌ `Cannot find module '../database/skillgap.db'` — DB not found

The database file hasn't been created yet. Run from the `backend/` folder:
```bash
npm run init-db
```

If you moved files around, check that your folder structure matches exactly:
```
Skill_Gap_Analyzer/
├── database/    ← must be here
└── backend/     ← run commands from here
```

---

### ❌ `CORS error` in browser console

The frontend origin isn't allowed by the backend. Open `backend/.env` and set:
```env
CORS_ORIGIN=*
```

For a specific origin (e.g., Live Server):
```env
CORS_ORIGIN=http://127.0.0.1:5500
```

Then restart the server: `npm run dev`

---

### ❌ `401 Unauthorized` on protected routes

Your JWT has expired or is missing. Either:
- Log out and log back in to get a fresh token
- Increase expiry in `backend/.env`: `JWT_EXPIRES_IN=30d`

---

### ❌ Puppeteer / PDF export fails

The PDF endpoint requires Chrome. If it fails:

**Option 1 — Skip Chrome download and use your installed Chrome:**
```cmd
set PUPPETEER_SKIP_DOWNLOAD=true
npm install puppeteer
```
Then in `backend/controllers/resultController.js`, update the launch call:
```js
const puppeteer = require('puppeteer-core');
browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new',
});
```

**Option 2 — Re-download Chrome:**
```bash
npx puppeteer browsers install chrome
```

---

### ❌ `npm install` fails on `better-sqlite3`

This package compiles native code and needs build tools:

**Windows:**
```cmd
npm install --global windows-build-tools
# or install Visual C++ Build Tools from:
# https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

**macOS:**
```bash
xcode-select --install
```

**Ubuntu/Debian:**
```bash
sudo apt install build-essential python3
```

---

### ❌ Frontend shows blank / fetch errors when opened as `file://`

Browsers block cross-origin fetch from `file://` URLs. Use VS Code Live Server or Python:
```bash
cd frontend
python -m http.server 5500
```
Then open `http://localhost:5500`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 18+ |
| **API Server** | Express 4 |
| **Database** | SQLite via better-sqlite3 |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Validation** | express-validator |
| **Security** | helmet + cors |
| **PDF Export** | Puppeteer (headless Chrome) |
| **Logging** | Winston |
| **Frontend** | Vanilla HTML5 / CSS3 / JavaScript |
| **Charts** | Chart.js 4 (CDN) |

---

*Built with ⚡ — No frameworks. No databases to install. Just Node.js and a `.db` file.*
