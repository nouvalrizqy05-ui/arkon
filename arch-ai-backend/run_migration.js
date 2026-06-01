/**
 * ARKON Automated Migration Runner
 * NFR-MAINT-005: Terintegrasi dengan CI/CD pipeline
 * 
 * Run: node run_migration.js
 * Or:  npm run migrate
 * 
 * Runs all pending migrations in order from migrations/ directory
 */
const fs   = require('fs');
const path = require('path');
const pool = require('./config/db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    // 1. Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id           SERIAL PRIMARY KEY,
        filename     VARCHAR(255) UNIQUE NOT NULL,
        applied_at   TIMESTAMPTZ DEFAULT NOW(),
        checksum     VARCHAR(64)
      );
    `);

    // 2. Get already-applied migrations
    const applied = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
    const appliedSet = new Set(applied.rows.map(r => r.filename));

    // 3. Get all .sql files in migrations dir, sorted
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    const pending = files.filter(f => !appliedSet.has(f));

    if (pending.length === 0) {
      console.log('✅ No pending migrations. Database is up to date.');
      return;
    }

    console.log(`📦 Found ${pending.length} pending migration(s):`);
    pending.forEach(f => console.log(`   - ${f}`));
    console.log('');

    // 4. Run each pending migration in a transaction
    for (const filename of pending) {
      const filepath = path.join(MIGRATIONS_DIR, filename);
      const sql = fs.readFileSync(filepath, 'utf-8');
      const checksum = require('crypto').createHash('md5').update(sql).digest('hex');

      try {
        await client.query('BEGIN');
        console.log(`▶ Running: ${filename}`);
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)',
          [filename, checksum]
        );
        await client.query('COMMIT');
        console.log(`✅ Applied: ${filename}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed: ${filename}`);
        console.error(`   Error: ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`\n🎉 All ${pending.length} migration(s) applied successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

// Verify checksums of already-applied migrations (detect tampering)
async function verifyMigrations() {
  const client = await pool.connect();
  try {
    const applied = await client.query('SELECT filename, checksum FROM schema_migrations ORDER BY filename');
    let errors = 0;
    for (const row of applied.rows) {
      const filepath = path.join(MIGRATIONS_DIR, row.filename);
      if (!fs.existsSync(filepath)) {
        console.warn(`⚠️  Migration file missing: ${row.filename}`);
        continue;
      }
      const sql = fs.readFileSync(filepath, 'utf-8');
      const checksum = require('crypto').createHash('md5').update(sql).digest('hex');
      if (checksum !== row.checksum) {
        console.error(`❌ Checksum mismatch: ${row.filename} (file was modified after being applied!)`);
        errors++;
      }
    }
    if (errors === 0) console.log('✅ All applied migrations verified.');
    return errors === 0;
  } finally {
    client.release();
  }
}

const args = process.argv.slice(2);
if (args[0] === 'verify') {
  verifyMigrations().then(ok => process.exit(ok ? 0 : 1)).catch(console.error);
} else {
  runMigrations().catch(err => { console.error(err); process.exit(1); });
}
