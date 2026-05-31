-- ============================================================
-- Smart Skill-Gap Analyzer — Database Schema
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- ------------------------------------------------------------
-- 1. users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. career_roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS career_roles (
  role_id     INTEGER PRIMARY KEY AUTOINCREMENT,
  role_name   TEXT NOT NULL,
  domain      TEXT NOT NULL,
  description TEXT
);

-- ------------------------------------------------------------
-- 3. required_skills  (weights per role must sum to 100)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS required_skills (
  skill_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id    INTEGER NOT NULL REFERENCES career_roles(role_id) ON DELETE CASCADE,
  skill_name TEXT    NOT NULL,
  weight     REAL    NOT NULL CHECK(weight > 0),
  min_level  INTEGER NOT NULL CHECK(min_level BETWEEN 1 AND 5)
);

-- ------------------------------------------------------------
-- 4. user_skills
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id           INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  skill_name        TEXT    NOT NULL,
  proficiency_level INTEGER NOT NULL CHECK(proficiency_level BETWEEN 1 AND 5),
  added_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill_name)
);

-- ------------------------------------------------------------
-- 5. analysis_results
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analysis_results (
  result_id   INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
  role_id     INTEGER NOT NULL REFERENCES career_roles(role_id) ON DELETE CASCADE,
  score       REAL    NOT NULL CHECK(score BETWEEN 0 AND 100),
  level       TEXT    NOT NULL CHECK(level IN ('Beginner','Intermediate','Advanced','Expert')),
  analyzed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 6. skill_gaps
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_gaps (
  gap_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id      INTEGER NOT NULL REFERENCES analysis_results(result_id) ON DELETE CASCADE,
  skill_name     TEXT    NOT NULL,
  gap_type       TEXT    NOT NULL CHECK(gap_type IN ('missing','weak','adequate')),
  user_level     INTEGER CHECK(user_level     IS NULL OR user_level     BETWEEN 0 AND 5),
  required_level INTEGER CHECK(required_level IS NULL OR required_level BETWEEN 1 AND 5),
  resource_url   TEXT
);

-- ------------------------------------------------------------
-- Indexes for common query patterns
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_required_skills_role   ON required_skills(role_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user        ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_user_role      ON analysis_results(user_id, role_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_result       ON skill_gaps(result_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_type         ON skill_gaps(gap_type);
