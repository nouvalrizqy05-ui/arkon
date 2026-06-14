const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xwcjaqnbhrjohpbnjxzb',
  password: 'Jakarta123!456',
  ssl: { rejectUnauthorized: false }
});

pool.query("ALTER TABLE pc_builds ADD COLUMN IF NOT EXISTS dosen_feedback TEXT;")
  .then(() => console.log('added dosen_feedback to pc_builds'))
  .catch(e => console.error(e))
  .finally(() => pool.end());
