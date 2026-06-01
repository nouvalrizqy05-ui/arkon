const pool = require('./config/db');

async function seedData() {
  try {
    const studentsRes = await pool.query("SELECT id FROM users WHERE role = 'mahasiswa'");
    const roomsRes = await pool.query("SELECT id FROM rooms");

    console.log(`Seeding data for ${studentsRes.rowCount} students and ${roomsRes.rowCount} rooms...`);

    for (const room of roomsRes.rows) {
      for (let i = 0; i < studentsRes.rows.length; i++) {
        const student = studentsRes.rows[i];
        
        // Ensure student is in room_members
        await pool.query(`
          INSERT INTO room_members (room_id, student_id, joined_at) 
          VALUES ($1, $2, NOW()) 
          ON CONFLICT DO NOTHING
        `, [room.id, student.id]);

        // 1. Seed IRT Theta
        // Some are smart, some are at risk
        let theta = (Math.random() * 6) - 3; // -3.0 to 3.0
        // Force at least 1 at risk (< -1.0)
        if (i === 0) theta = -1.5; 
        
        await pool.query(`
          INSERT INTO student_ability (student_id, room_id, theta, responses_count, last_updated)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (student_id, room_id) DO UPDATE SET theta = EXCLUDED.theta, responses_count = EXCLUDED.responses_count
        `, [student.id, room.id, theta, Math.floor(Math.random() * 50) + 10]);
        
        await pool.query(`UPDATE users SET theta = $1 WHERE id = $2`, [theta, student.id]);

        // 2. Seed N-Gain (Analytics)
        const preScore = Math.floor(Math.random() * 40) + 30; // 30-69
        let postScore = preScore + Math.floor(Math.random() * 30) + 5; // higher
        if (postScore > 100) postScore = 100;
        
        // Delete existing analytics for this student to avoid messing it up
        await pool.query("DELETE FROM analytics WHERE student_id = $1 AND room_id = $2", [student.id, room.id]);

        // Try getting a material id if available, otherwise just rely on NULL if schema allows it or ignore
        const matRes = await pool.query("SELECT id FROM materials WHERE room_id = $1 LIMIT 1", [room.id]);
        const matId = matRes.rows.length > 0 ? matRes.rows[0].id : null;

        const insertQuery = matId 
          ? `INSERT INTO analytics (room_id, student_id, score, created_at, material_id) VALUES ($1, $2, $3, $4, $5)`
          : `INSERT INTO analytics (room_id, student_id, score, created_at) VALUES ($1, $2, $3, $4)`;

        if (matId) {
          await pool.query(insertQuery, [room.id, student.id, preScore, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), matId]);
          await pool.query(insertQuery, [room.id, student.id, postScore, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), matId]);
        } else {
          await pool.query(insertQuery, [room.id, student.id, preScore, new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)]);
          await pool.query(insertQuery, [room.id, student.id, postScore, new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)]);
        }
      }
    }
    console.log('✅ Demo data seeded successfully!');
    process.exit(0);
  } catch(e) {
    console.error('Error seeding data:', e);
    process.exit(1);
  }
}

seedData();
