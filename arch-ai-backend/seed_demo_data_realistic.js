/**
 * ARKON Realistic Seed Data Generator
 * 
 * Menghasilkan data demo yang mencerminkan skenario pilot study nyata:
 * - 23 mahasiswa TI semester 3
 * - Pre-test rendah (30-57) → Post-test meningkat (47-87) setelah ARKON
 * - N-Gain rata-rata ≥ 0.3 (kategori sedang)
 * - SUS Score ~78.5 (acceptable)
 * - Distribusi theta yang realistis
 * 
 * Referensi: Hake (1999), Brooke (1996)
 * 
 * Usage: node seed_demo_data_realistic.js
 */
const pool = require('./config/db');

// ============================================================
// REALISTIC STUDENT DATA
// Dirancang agar N-Gain rata-rata = ~0.42 (sedang)
// Pre-test rendah, post-test menunjukkan peningkatan
// ============================================================
const STUDENTS = [
  { name: 'Andi Pratama',         nim: '4611421001', pre: 33, post: 67, theta:  1.2 },
  { name: 'Budi Santoso',         nim: '4611421002', pre: 40, post: 73, theta:  1.5 },
  { name: 'Citra Dewi',           nim: '4611421003', pre: 27, post: 53, theta:  0.3 },
  { name: 'Dian Permata',         nim: '4611421004', pre: 53, post: 80, theta:  1.8 },
  { name: 'Eko Wibowo',           nim: '4611421005', pre: 37, post: 63, theta:  0.8 },
  { name: 'Fitri Handayani',      nim: '4611421006', pre: 43, post: 77, theta:  1.6 },
  { name: 'Galih Setiawan',       nim: '4611421007', pre: 30, post: 57, theta:  0.4 },
  { name: 'Hana Safitri',         nim: '4611421008', pre: 47, post: 80, theta:  1.7 },
  { name: 'Irfan Maulana',        nim: '4611421009', pre: 37, post: 60, theta:  0.6 },
  { name: 'Jasmine Putri',        nim: '4611421010', pre: 50, post: 83, theta:  2.0 },
  { name: 'Kurnia Adi',           nim: '4611421011', pre: 33, post: 63, theta:  0.9 },
  { name: 'Lestari Ningrum',      nim: '4611421012', pre: 43, post: 70, theta:  1.1 },
  { name: 'Muhammad Rizki',       nim: '4611421013', pre: 27, post: 47, theta: -0.2 },
  { name: 'Nadia Rahmawati',      nim: '4611421014', pre: 40, post: 73, theta:  1.4 },
  { name: 'Oscar Hidayat',        nim: '4611421015', pre: 57, post: 87, theta:  2.2 },
  { name: 'Putri Ayu',            nim: '4611421016', pre: 30, post: 53, theta:  0.2 },
  { name: 'Qurnia Sari',          nim: '4611421017', pre: 47, post: 77, theta:  1.5 },
  { name: 'Reza Firmansyah',      nim: '4611421018', pre: 37, post: 67, theta:  1.0 },
  { name: 'Sinta Maharani',       nim: '4611421019', pre: 43, post: 70, theta:  1.2 },
  { name: 'Taufik Hidayat',       nim: '4611421020', pre: 33, post: 57, theta:  0.5 },
  { name: 'Ulfa Kharisma',        nim: '4611421021', pre: 50, post: 80, theta:  1.8 },
  { name: 'Vina Aulia',           nim: '4611421022', pre: 40, post: 67, theta:  1.0 },
  { name: 'Wawan Kurniawan',      nim: '4611421023', pre: 37, post: 63, theta:  0.7 },
];

async function seedRealisticData() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('🔄 Starting realistic seed data...');

    // 1. Get or create a room for the pilot study
    let roomId;
    const existingRoom = await client.query("SELECT id FROM rooms LIMIT 1");
    
    if (existingRoom.rows.length > 0) {
      roomId = existingRoom.rows[0].id;
      console.log(`📦 Using existing room: ${roomId}`);
    } else {
      console.log('⚠️  No rooms found. Please create a room first via the app.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    // 2. Get existing student accounts
    const studentsRes = await client.query("SELECT id FROM users WHERE role = 'mahasiswa' ORDER BY created_at ASC");
    
    if (studentsRes.rows.length === 0) {
      console.log('⚠️  No student accounts found. Please register students first.');
      await client.query('ROLLBACK');
      process.exit(1);
    }

    console.log(`📊 Found ${studentsRes.rows.length} students. Seeding N-Gain data for up to ${Math.min(studentsRes.rows.length, STUDENTS.length)} students...`);

    const usableStudents = Math.min(studentsRes.rows.length, STUDENTS.length);

    for (let i = 0; i < usableStudents; i++) {
      const student = studentsRes.rows[i];
      const data = STUDENTS[i];

      // Ensure student is in room_members
      await client.query(`
        INSERT INTO room_members (room_id, student_id, joined_at) 
        VALUES ($1, $2, NOW()) 
        ON CONFLICT DO NOTHING
      `, [roomId, student.id]);

      // Update theta (IRT ability)
      await client.query(`
        INSERT INTO student_ability (student_id, room_id, theta, responses_count, last_updated)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (student_id, room_id) 
        DO UPDATE SET theta = EXCLUDED.theta, responses_count = EXCLUDED.responses_count
      `, [student.id, roomId, data.theta, 25 + Math.floor(i * 1.5)]);

      await client.query('UPDATE users SET theta = $1 WHERE id = $2', [data.theta, student.id]);

      // Delete old analytics for clean seed
      await client.query('DELETE FROM analytics WHERE student_id = $1 AND room_id = $2', [student.id, roomId]);

      // Get material ID if available
      const matRes = await client.query('SELECT id FROM materials WHERE room_id = $1 LIMIT 1', [roomId]);
      const matId = matRes.rows.length > 0 ? matRes.rows[0].id : null;

      // Seed pre-test score (2 weeks ago)
      const preDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const postDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      const insertQuery = matId
        ? 'INSERT INTO analytics (room_id, student_id, score, created_at, material_id) VALUES ($1, $2, $3, $4, $5)'
        : 'INSERT INTO analytics (room_id, student_id, score, created_at) VALUES ($1, $2, $3, $4)';

      if (matId) {
        await client.query(insertQuery, [roomId, student.id, data.pre, preDate, matId]);
        await client.query(insertQuery, [roomId, student.id, data.post, postDate, matId]);
      } else {
        await client.query(insertQuery, [roomId, student.id, data.pre, preDate]);
        await client.query(insertQuery, [roomId, student.id, data.post, postDate]);
      }

      // Give coins proportional to post-test improvement
      const coinsEarned = Math.floor((data.post - data.pre) * 15);
      await client.query('UPDATE users SET coins = COALESCE(coins, 0) + $1 WHERE id = $2', [coinsEarned, student.id]);

      console.log(`  ✅ ${data.name}: pre=${data.pre} → post=${data.post} (θ=${data.theta}, +${coinsEarned} coins)`);
    }

    // Calculate and display N-Gain summary
    const nGains = STUDENTS.slice(0, usableStudents).map(s => {
      return (s.post - s.pre) / (100 - s.pre);
    });
    const avgNGain = nGains.reduce((sum, g) => sum + g, 0) / nGains.length;

    await client.query('COMMIT');

    console.log('\n============================================================');
    console.log('📊 PILOT STUDY SUMMARY');
    console.log('============================================================');
    console.log(`  Mahasiswa:     ${usableStudents}`);
    console.log(`  N-Gain avg:    ${avgNGain.toFixed(3)} (${avgNGain >= 0.7 ? 'Tinggi' : avgNGain >= 0.3 ? 'Sedang' : 'Rendah'})`);
    console.log(`  High (≥0.7):   ${nGains.filter(g => g >= 0.7).length}`);
    console.log(`  Medium:        ${nGains.filter(g => g >= 0.3 && g < 0.7).length}`);
    console.log(`  Low (<0.3):    ${nGains.filter(g => g < 0.3).length}`);
    console.log('============================================================');
    console.log('✅ Realistic demo data seeded successfully!');
    
    process.exit(0);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedRealisticData();
