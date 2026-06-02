const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// ═══ TEMPORARY DIAGNOSTIC ENDPOINT (REMOVE AFTER DEBUG) ═══
router.get('/debug', async (req, res) => {
  const results = {};
  try {
    // 1. Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'study_group%'
      ORDER BY table_name
    `);
    results.tables = tablesCheck.rows.map(r => r.table_name);

    // 2. Check study_group_messages columns
    const colCheck = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'study_group_messages' 
      ORDER BY ordinal_position
    `);
    results.message_columns = colCheck.rows;

    // 3. Try a simple SELECT on messages
    try {
      const msgTest = await pool.query('SELECT COUNT(*) as total FROM study_group_messages');
      results.message_count = msgTest.rows[0].total;
    } catch (err) {
      results.message_query_error = err.message;
    }

    // 4. Try a simple SELECT on groups
    try {
      const grpTest = await pool.query('SELECT id, name FROM study_groups LIMIT 3');
      results.sample_groups = grpTest.rows;
    } catch (err) {
      results.group_query_error = err.message;
    }

    // 5. Try the exact GET messages query that's failing
    try {
      const exactQuery = await pool.query(`
        SELECT m.*, COALESCE(u.full_name, 'System') as student_name 
        FROM study_group_messages m
        LEFT JOIN users u ON m.student_id = u.id
        WHERE m.group_id = $1 ORDER BY m.created_at ASC
      `, ['acf48fd9-e0d4-4fe3-9225-1e2218264b2c']);
      results.exact_query_result = { success: true, count: exactQuery.rows.length };
    } catch (err) {
      results.exact_query_error = { message: err.message, code: err.code, detail: err.detail };
    }

    // 6. Check tasks table too (known working, for comparison)
    try {
      const taskTest = await pool.query('SELECT COUNT(*) as total FROM study_group_tasks');
      results.task_count = taskTest.rows[0].total;
    } catch (err) {
      results.task_query_error = err.message;
    }

    res.json({ status: 'diagnostic_complete', ...results });
  } catch (err) {
    res.status(500).json({ status: 'diagnostic_failed', error: err.message, code: err.code });
  }
});

// Buat grup baru
router.post('/', authenticateToken, async (req, res) => {
  const { room_id, name, creator_id } = req.body;
  const group_code = `${name.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const group = await pool.query(
      'INSERT INTO study_groups (room_id, name, group_code, creator_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [room_id, name, group_code, creator_id]
    );
    const groupId = group.rows[0].id;
    // Otomatis masukkan pembuat sebagai anggota
    await pool.query('INSERT INTO study_group_members (group_id, student_id) VALUES ($1, $2)', [groupId, creator_id]);
    res.status(201).json(group.rows[0]);
  } catch (err) {
    console.error('🔥 SG CREATE ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat grup' });
  }
});

// Join grup via kode
router.post('/join', authenticateToken, async (req, res) => {
  const { student_id, group_code } = req.body;
  try {
    const groupResult = await pool.query('SELECT id FROM study_groups WHERE group_code = $1', [group_code]);
    if (groupResult.rows.length === 0) return res.status(404).json({ error: 'Kode grup tidak ditemukan' });
    
    const groupId = groupResult.rows[0].id;
    await pool.query('INSERT INTO study_group_members (group_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [groupId, student_id]);
    res.json({ message: 'Berhasil bergabung', groupId });
  } catch (err) {
    console.error('🔥 SG JOIN ERROR:', err);
    res.status(500).json({ error: 'Gagal bergabung ke grup' });
  }
});

// List grup dalam satu room (Classroom)
router.get('/room/:roomId', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const studentId = req.user.id;
  try {
    const result = await pool.query(`
      SELECT sg.*, 
        (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) as member_count,
        EXISTS(SELECT 1 FROM study_group_members WHERE group_id = sg.id AND student_id = $2) as is_member
      FROM study_groups sg WHERE room_id = $1 ORDER BY created_at DESC
    `, [roomId, studentId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil grup' });
  }
});

// History pesan
router.get('/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, COALESCE(u.full_name, 'System') as student_name 
      FROM study_group_messages m
      LEFT JOIN users u ON m.student_id = u.id
      WHERE m.group_id = $1 ORDER BY m.created_at ASC
    `, [req.params.groupId]);
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 SG MESSAGES ERROR:', err.message);
    res.status(500).json({ error: 'Gagal mengambil pesan', detail: err.message });
  }
});

// Simpan pesan
router.post('/:groupId/messages', authenticateToken, async (req, res) => {
  const { content, message_type } = req.body;
  const student_id = req.user.id; // SECURITY: Enforce authenticated ID
  if (!content?.trim()) return res.status(400).json({ error: 'Pesan tidak boleh kosong' });

  try {
    // SECURITY/ROBUSTNESS: Verify if the group actually exists
    const groupExists = await pool.query('SELECT 1 FROM study_groups WHERE id = $1', [req.params.groupId]);
    if (groupExists.rows.length === 0) {
      return res.status(404).json({ error: 'Grup tidak ditemukan atau telah dihapus.' });
    }

    const result = await pool.query(
      'INSERT INTO study_group_messages (group_id, student_id, content, message_type) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.groupId, student_id || null, content, message_type || 'chat']
    );

    // Get student name safely
    let studentName = 'System';
    if (student_id) {
      const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [student_id]);
      if (userResult.rows.length > 0) studentName = userResult.rows[0].full_name;
    }
    const message = { ...result.rows[0], student_name: studentName };
    
    // Broadcast via Socket.IO
    const io = req.app.get('io') || global.io;
    if (message_type === 'note') {
      io.to(`sg:${req.params.groupId}`).emit('sg:note-update', content);
    } else {
      io.to(`sg:${req.params.groupId}`).emit('sg:message', message);
    }
    
    res.status(201).json(message);
  } catch (err) {
    console.error('🔥 SG SAVE MSG ERROR:', err.message);
    res.status(500).json({ error: 'Gagal menyimpan pesan', detail: err.message });
  }
});

// Monitoring Dosen (Activity Metadata)
router.get('/activity/:roomId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sg.id, sg.name, sg.group_code, u.full_name as creator_name,
        (SELECT COUNT(*) FROM study_group_members WHERE group_id = sg.id) as member_count,
        COUNT(msg.id) as message_count,
        MAX(msg.created_at) as last_activity
      FROM study_groups sg
      LEFT JOIN users u ON sg.creator_id = u.id
      LEFT JOIN study_group_messages msg ON sg.id = msg.group_id
      WHERE sg.room_id = $1
      GROUP BY sg.id, u.full_name ORDER BY last_activity DESC NULLS LAST
    `, [req.params.roomId]);
    
    const sgOnlineUsers = req.app.get('sgOnlineUsers');
    
    // Add online status from memory map
    const data = result.rows.map(row => ({
      ...row,
      online_count: sgOnlineUsers.get(row.id)?.size || 0
    }));
    
    res.json(data);
  } catch (err) {
    console.error('🔥 SG MONITOR ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil aktivitas grup' });
  }
});

// Hapus Grup (Only Creator, Owner of room, or Lecturer)
router.delete('/:groupId', authenticateToken, async (req, res) => {
  try {
    const groupResult = await pool.query('SELECT * FROM study_groups WHERE id = $1', [req.params.groupId]);
    if (groupResult.rows.length === 0) return res.status(404).json({ error: 'Grup tidak ditemukan.' });
    
    const group = groupResult.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;
    
    let allowed = false;
    
    if (userRole === 'dosen') {
      // Dosen in room has full delete access
      const roomResult = await pool.query('SELECT dosen_id, owner_id FROM rooms WHERE id = $1', [group.room_id]);
      if (roomResult.rows.length > 0) {
        const room = roomResult.rows[0];
        if (room.dosen_id === userId || room.owner_id === userId) {
          allowed = true;
        }
      }
    } else {
      // Mahasiswa: must be the creator of the group
      if (group.creator_id === userId) {
        allowed = true;
      }
    }
    
    if (!allowed) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk menghapus grup ini.' });
    }
    
    // Delete the group (cascades to members, messages, etc. on database level)
    await pool.query('DELETE FROM study_groups WHERE id = $1', [req.params.groupId]);
    
    // Broadcast via socket to close/kick all online members inside the group
    const io = req.app.get('io') || global.io;
    io.to(`sg:${req.params.groupId}`).emit('sg:group-deleted', { groupId: req.params.groupId });
    
    res.json({ message: 'Grup berhasil dihapus.' });
  } catch (err) {
    console.error('🔥 SG DELETE ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus grup', detail: err.message });
  }
});

// ==========================================
// KANBAN TASKS DATABASE ENDPOINTS
// ==========================================

// Get all tasks for a group
router.get('/:groupId/tasks', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM study_group_tasks WHERE group_id = $1 ORDER BY created_at ASC',
      [req.params.groupId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('🔥 SG GET TASKS ERROR:', err);
    res.status(500).json({ error: 'Gagal mengambil data tugas', detail: err.message });
  }
});

// Create a new task in group
router.post('/:groupId/tasks', authenticateToken, async (req, res) => {
  const { title, status, assignee } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Judul tugas tidak boleh kosong' });

  try {
    const result = await pool.query(
      'INSERT INTO study_group_tasks (group_id, title, status, assignee) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.groupId, title.trim(), status || 'todo', assignee || '']
    );
    
    const task = result.rows[0];
    
    // Fetch all current tasks to broadcast updated list
    const allTasks = await pool.query('SELECT * FROM study_group_tasks WHERE group_id = $1 ORDER BY created_at ASC', [req.params.groupId]);
    
    // Broadcast updated tasks list via Socket.IO
    const io = req.app.get('io') || global.io;
    io.to(`sg:${req.params.groupId}`).emit('sg:tasks-update', allTasks.rows);
    
    res.status(201).json(task);
  } catch (err) {
    console.error('🔥 SG CREATE TASK ERROR:', err);
    res.status(500).json({ error: 'Gagal membuat tugas', detail: err.message });
  }
});

// Update task status or assignee (on drag-drop or inline edit)
router.put('/:groupId/tasks/:taskId', authenticateToken, async (req, res) => {
  const { status, assignee, title } = req.body;
  try {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (assignee !== undefined) {
      fields.push(`assignee = $${paramIndex++}`);
      values.push(assignee);
    }
    if (title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(title.trim());
    }

    if (fields.length === 0) return res.status(400).json({ error: 'Tidak ada data untuk diperbarui' });

    values.push(req.params.taskId);
    values.push(req.params.groupId);
    
    const query = `
      UPDATE study_group_tasks 
      SET ${fields.join(', ')} 
      WHERE id = $${paramIndex++} AND group_id = $${paramIndex++} 
      RETURNING *
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

    // Fetch all tasks and broadcast updated list
    const allTasks = await pool.query('SELECT * FROM study_group_tasks WHERE group_id = $1 ORDER BY created_at ASC', [req.params.groupId]);
    
    const io = req.app.get('io') || global.io;
    io.to(`sg:${req.params.groupId}`).emit('sg:tasks-update', allTasks.rows);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('🔥 SG UPDATE TASK ERROR:', err);
    res.status(500).json({ error: 'Gagal memperbarui tugas', detail: err.message });
  }
});

// Delete a task
router.delete('/:groupId/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM study_group_tasks WHERE id = $1 AND group_id = $2 RETURNING *',
      [req.params.taskId, req.params.groupId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tugas tidak ditemukan' });

    // Fetch all tasks and broadcast updated list
    const allTasks = await pool.query('SELECT * FROM study_group_tasks WHERE group_id = $1 ORDER BY created_at ASC', [req.params.groupId]);
    
    const io = req.app.get('io') || global.io;
    io.to(`sg:${req.params.groupId}`).emit('sg:tasks-update', allTasks.rows);

    res.json({ message: 'Tugas berhasil dihapus' });
  } catch (err) {
    console.error('🔥 SG DELETE TASK ERROR:', err);
    res.status(500).json({ error: 'Gagal menghapus tugas', detail: err.message });
  }
});

module.exports = router;
