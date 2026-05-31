-- ============================================================
-- Smart Skill-Gap Analyzer — Seed Data
-- ============================================================
-- Weights per role sum to exactly 100.
-- resource_url links point to free, publicly available courses.
-- ============================================================

-- ------------------------------------------------------------
-- career_roles  (5 roles)
-- ------------------------------------------------------------
INSERT INTO career_roles (role_name, domain, description) VALUES
  (
    'Software Engineer',
    'Engineering',
    'Designs, builds, and maintains software systems and applications across the full stack, following engineering best practices such as version control, testing, and CI/CD.'
  ),
  (
    'Data Scientist',
    'Data & AI',
    'Extracts actionable insights from large datasets using statistical analysis, machine learning, and data visualisation, and communicates findings to stakeholders.'
  ),
  (
    'UI/UX Designer',
    'Design',
    'Creates intuitive, accessible, and visually compelling digital experiences through user research, wireframing, prototyping, and iterative usability testing.'
  ),
  (
    'Cybersecurity Analyst',
    'Security',
    'Protects organisational assets by monitoring networks, identifying vulnerabilities, responding to incidents, and implementing security controls and policies.'
  ),
  (
    'Project Manager',
    'Management',
    'Plans, executes, and closes projects on time and within budget by coordinating cross-functional teams, managing risks, and communicating with stakeholders.'
  );

-- ============================================================
-- required_skills
-- ============================================================

-- ------------------------------------------------------------
-- Role 1 — Software Engineer  (role_id = 1)
-- 10 skills — weights: 15+14+13+12+11+10+9+7+5+4 = 100
-- ------------------------------------------------------------
INSERT INTO required_skills (role_id, skill_name, weight, min_level) VALUES
  (1, 'Data Structures & Algorithms',   15, 4),
  (1, 'Python or JavaScript',           14, 4),
  (1, 'System Design',                  13, 3),
  (1, 'Version Control (Git)',           12, 3),
  (1, 'REST API Design',                 11, 3),
  (1, 'Unit & Integration Testing',      10, 3),
  (1, 'SQL & Relational Databases',       9, 3),
  (1, 'CI/CD Pipelines',                  7, 2),
  (1, 'Docker & Containerisation',        5, 2),
  (1, 'Cloud Fundamentals (AWS/GCP/Azure)', 4, 2);

-- ------------------------------------------------------------
-- Role 2 — Data Scientist  (role_id = 2)
-- 10 skills — weights: 16+15+13+12+10+10+8+7+5+4 = 100
-- ------------------------------------------------------------
INSERT INTO required_skills (role_id, skill_name, weight, min_level) VALUES
  (2, 'Machine Learning Fundamentals',  16, 4),
  (2, 'Python (NumPy, Pandas, Scikit-learn)', 15, 4),
  (2, 'Statistics & Probability',       13, 4),
  (2, 'Data Wrangling & EDA',           12, 3),
  (2, 'SQL & Data Querying',            10, 3),
  (2, 'Data Visualisation (Matplotlib/Seaborn/Plotly)', 10, 3),
  (2, 'Deep Learning (TensorFlow/PyTorch)',  8, 2),
  (2, 'Feature Engineering',             7, 3),
  (2, 'Model Evaluation & Validation',   5, 3),
  (2, 'Big Data Tools (Spark/Hadoop)',    4, 2);

-- ------------------------------------------------------------
-- Role 3 — UI/UX Designer  (role_id = 3)
-- 10 skills — weights: 16+14+13+12+11+10+8+7+5+4 = 100
-- ------------------------------------------------------------
INSERT INTO required_skills (role_id, skill_name, weight, min_level) VALUES
  (3, 'User Research & Usability Testing', 16, 4),
  (3, 'Wireframing & Prototyping',          14, 4),
  (3, 'Figma / Adobe XD',                  13, 4),
  (3, 'Information Architecture',           12, 3),
  (3, 'Visual Design Principles',           11, 3),
  (3, 'Interaction Design',                 10, 3),
  (3, 'Accessibility (WCAG Standards)',      8, 3),
  (3, 'Design Systems & Component Libraries', 7, 3),
  (3, 'HTML & CSS Basics',                   5, 2),
  (3, 'Motion & Micro-interactions',          4, 2);

-- ------------------------------------------------------------
-- Role 4 — Cybersecurity Analyst  (role_id = 4)
-- 10 skills — weights: 15+14+12+12+10+10+9+8+6+4 = 100
-- ------------------------------------------------------------
INSERT INTO required_skills (role_id, skill_name, weight, min_level) VALUES
  (4, 'Network Security & Protocols',       15, 4),
  (4, 'Threat Detection & Incident Response', 14, 4),
  (4, 'SIEM Tools (Splunk / QRadar)',         12, 3),
  (4, 'Vulnerability Assessment & Pen Testing', 12, 3),
  (4, 'Operating Systems (Linux/Windows)',    10, 3),
  (4, 'Cryptography & PKI',                  10, 3),
  (4, 'Risk Management & Compliance (ISO 27001/NIST)', 9, 3),
  (4, 'Malware Analysis & Forensics',         8, 2),
  (4, 'Cloud Security',                        6, 2),
  (4, 'Scripting (Python/Bash)',               4, 2);

-- ------------------------------------------------------------
-- Role 5 — Project Manager  (role_id = 5)
-- 10 skills — weights: 16+15+13+11+10+9+8+7+6+5 = 100
-- ------------------------------------------------------------
INSERT INTO required_skills (role_id, skill_name, weight, min_level) VALUES
  (5, 'Project Planning & Scheduling',       16, 4),
  (5, 'Stakeholder Communication',           15, 4),
  (5, 'Risk Management',                     13, 4),
  (5, 'Agile & Scrum Methodologies',         11, 3),
  (5, 'Budget & Resource Management',        10, 3),
  (5, 'Team Leadership & Motivation',         9, 3),
  (5, 'Project Management Tools (Jira/Asana)', 8, 3),
  (5, 'Change Management',                    7, 3),
  (5, 'Quality Assurance & Delivery',         6, 3),
  (5, 'Business Analysis & Requirements Gathering', 5, 2);

-- ============================================================
-- skill_gaps — resource_url reference catalogue
-- (These are linked when gaps are created by the application;
--  pre-loaded here for static reference / seeding the resource
--  library used by the gap-detection logic.)
-- ============================================================
-- The table below is a reference comment — actual gap rows are
-- inserted at analysis time. Resource URLs are stored per gap.
--
-- Free course links used throughout the application:
--
-- Data Structures & Algorithms    → https://www.coursera.org/learn/algorithms-part1
-- Python                          → https://www.learnpython.org
-- JavaScript                      → https://javascript.info
-- System Design                   → https://www.educative.io/courses/grokking-the-system-design-interview
-- Git / Version Control            → https://learngitbranching.js.org
-- REST APIs                        → https://www.restapitutorial.com
-- Testing                          → https://testautomationu.applitools.com
-- SQL                              → https://www.sqlcourse.com
-- CI/CD                            → https://www.coursera.org/learn/devops-cloud-and-agile-foundations
-- Docker                           → https://docker-curriculum.com
-- Cloud Fundamentals               → https://aws.amazon.com/training/digital/
-- Machine Learning                 → https://www.coursera.org/learn/machine-learning
-- Statistics                       → https://www.khanacademy.org/math/statistics-probability
-- Data Visualisation               → https://www.coursera.org/learn/data-visualization
-- Deep Learning                    → https://www.deeplearning.ai/courses/
-- Feature Engineering              → https://www.kaggle.com/learn/feature-engineering
-- Big Data                         → https://www.coursera.org/learn/big-data-essentials
-- UX Research                      → https://www.coursera.org/learn/ux-research-at-scale
-- Wireframing/Prototyping          → https://www.coursera.org/learn/wireframes-and-low-fidelity-prototypes
-- Figma                            → https://www.youtube.com/c/figma
-- Information Architecture        → https://www.nngroup.com/articles/information-architecture-study-guide/
-- Visual Design                    → https://www.coursera.org/learn/fundamentals-of-graphic-design
-- Accessibility                    → https://www.udacity.com/course/web-accessibility--ud891
-- Design Systems                  → https://www.designbetter.co/design-systems-handbook
-- Network Security                 → https://www.coursera.org/learn/ibm-cybersecurity-analyst-assessment
-- Incident Response                → https://www.sans.org/free/
-- SIEM                             → https://www.splunk.com/en_us/training/free-courses.html
-- Pen Testing                      → https://www.hacksplaining.com
-- Cryptography                     → https://www.coursera.org/learn/crypto
-- Risk & Compliance                → https://www.isaca.org/credentialing/cism
-- Malware Analysis                 → https://www.cybrary.it/course/malware-analysis/
-- Cloud Security                   → https://cloudacademy.com/learning-paths/cloud-security-fundamentals-1373/
-- Scripting (Security)             → https://automatetheboringstuff.com
-- Project Planning                 → https://www.coursera.org/learn/project-management-foundations
-- Stakeholder Communication        → https://www.pmi.org/learning/library
-- Agile/Scrum                      → https://www.scrum.org/resources/scrum-guide
-- Budgeting                        → https://www.coursera.org/learn/finance-for-non-finance-professionals
-- Leadership                       → https://www.coursera.org/learn/inspiring-leadership-emotional-intelligence
-- Jira/Asana                       → https://www.atlassian.com/agile/tutorials
-- Change Management                → https://www.prosci.com/resources/articles/change-management-primer
-- QA & Delivery                    → https://www.coursera.org/learn/software-processes-and-agile-practices
-- Business Analysis                → https://www.iiba.org/learning/
-- ============================================================
