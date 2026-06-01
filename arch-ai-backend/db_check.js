const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function checkMigration() {
  console.log('Menghubungkan ke database...');
  await client.connect();
  try {
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'student_work' 
      AND column_name IN ('grade', 'review_status', 'reviewed_by', 'reviewed_at');
    `);
    console.log('✅ Pengecekan Migration Selesai');
    console.log(`Ditemukan ${res.rows.length} kolom dari migrasi:`);
    console.table(res.rows);
    
    if (res.rows.length === 0) {
      console.log('⚠️ Kolom tidak ditemukan. Migration 001_room_rebuild.sql belum dijalankan!');
    }
  } catch (e) {
    console.error('❌ Terjadi kesalahan:', e);
  } finally {
    await client.end();
  }
}

checkMigration();
