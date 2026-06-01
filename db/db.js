const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = pool;