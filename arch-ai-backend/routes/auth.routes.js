const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/db');
const logError = (context, err) => console.error(`❌ [${context}]`, err?.message || err);
const { validateFullName, validateEmail, validateIdentifier, validatePassword } = require('../utils/validation');
const { escapeHtml } = require('../utils/sanitize');
const { authenticateToken } = require('../middleware/auth');

// Rate limiters — mencegah brute-force dan spam
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // max 10 percobaan per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' }
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // max 5 registrasi per IP per 15 menit
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan registrasi. Coba lagi nanti.' }
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Terlalu banyak permintaan refresh token. Tunggu sebentar.' }
});

router.post('/register', registerLimiter, async (req, res) => {
  const { full_name, identifier_number, email, role, password } = req.body;
  try {
    if (!full_name || !identifier_number || !email || !role || !password) {
      return res.status(400).json({ error: 'Semua field harus diisi!' });
    }

    let validatedFullName, validatedEmail, validatedIdentifier;
    try {
      validatedFullName = validateFullName(full_name);
      validatedEmail = validateEmail(email);
      validatedIdentifier = validateIdentifier(identifier_number);
      validatePassword(password);
    } catch (valErr) {
      return res.status(400).json({ error: valErr.message });
    }

    if (!['mahasiswa', 'dosen'].includes(role)) {
      return res.status(400).json({ error: 'Role harus "mahasiswa" atau "dosen".' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR identifier_number = $2',
      [validatedEmail, validatedIdentifier]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email atau Nomor Identitas sudah terdaftar.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(32).toString('hex');

    const newUser = await pool.query(
      `INSERT INTO users (full_name, identifier_number, email, role, password_hash, verification_token, is_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, full_name, email, role, identifier_number`,
      [
        validatedFullName,
        validatedIdentifier,
        validatedEmail,
        role,
        password_hash,
        verification_token,
        process.env.SKIP_EMAIL_VERIFICATION === 'true' // Auto-verified di mode demo
      ]
    );

    // Jika SKIP_EMAIL_VERIFICATION aktif, langsung sukses tanpa kirim email
    if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
      return res.status(201).json({
        message: 'Registrasi berhasil! Anda dapat langsung login.',
        user: newUser.rows[0]
      });
    }

    if (process.env.RESEND_API_KEY) {
      const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verification_token}`;
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'Arkon Team <onboarding@resend.dev>',
            to: [email],
            subject: 'Verifikasi Akun ARKON Workspace',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #6366f1;">Selamat Datang di ARKON!</h2>
                <p>Halo <strong>${escapeHtml(full_name)}</strong>,</p>
                <p>Terima kasih telah mendaftar. Silakan klik tombol di bawah untuk memverifikasi email Anda dan mengaktifkan akun:</p>
                <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verifikasi Email Saya</a>
                <p style="color: #666; font-size: 12px;">Jika Anda tidak merasa mendaftar di platform kami, abaikan email ini.</p>
              </div>
            `
          })
        });
      } catch (e) {
        console.error('Resend API (Verification) Error:', e);
      }
    }

    res.status(201).json({ message: 'Registrasi berhasil! Silakan cek email Anda untuk verifikasi.', user: newUser.rows[0] });
  } catch (error) {
    logError('REGISTER', error);
    if (error.code === '23505') return res.status(409).json({ error: 'NIM/NIP atau Email sudah terdaftar!' });
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  try {
    const result = await pool.query(
      'UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE verification_token = $1 RETURNING id',
      [token]
    );
    if (result.rows.length === 0) return res.status(400).json({ error: 'Token verifikasi tidak valid.' });
    res.json({ message: 'Email berhasil diverifikasi! Anda sekarang dapat login.' });
  } catch (error) {
    logError('VERIFY_EMAIL', error);
    res.status(500).json({ error: 'Gagal memverifikasi email.' });
  }
});

router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email diperlukan.' });

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });
    if (userRes.rows[0].is_verified) return res.status(400).json({ error: 'Akun sudah diverifikasi.' });

    const verification_token = crypto.randomBytes(32).toString('hex');
    await pool.query('UPDATE users SET verification_token = $1 WHERE email = $2', [verification_token, email]);

    const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verification_token}`;
    
    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Arkon Team <onboarding@resend.dev>',
          to: [email],
          subject: 'Verifikasi Akun ARKON Workspace (Kirim Ulang)',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
              <h2 style="color: #6366f1;">Verifikasi Email Anda</h2>
              <p>Halo <strong>${escapeHtml(userRes.rows[0].full_name)}</strong>,</p>
              <p>Ini adalah pengiriman ulang link verifikasi. Silakan klik tombol di bawah untuk mengaktifkan akun:</p>
              <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Verifikasi Email Saya</a>
            </div>
          `
        })
      });
    }
    res.json({ message: 'Email verifikasi baru berhasil dikirim.' });
  } catch (error) {
    logError('RESEND_VERIFY', error);
    res.status(500).json({ error: 'Gagal mengirim email.' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { identifier_number, password } = req.body;
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE identifier_number = $1', [identifier_number]);
    if (userResult.rows.length === 0) return res.status(401).json({ error: 'NIM/NIP tidak terdaftar!' });

    const user = userResult.rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'Akun lama terdeteksi. Silakan registrasi ulang.' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Password salah!' });

    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Email belum diverifikasi. Cek inbox Anda.',
        needs_verification: true,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
    
    // TASK-SEC-001: Store refresh token hash in DB for revocation support
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    try {
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, tokenHash, expiresAt, req.headers['user-agent'] || null, req.ip || null]
      );
    } catch (dbErr) {
      // Don't fail login if token storage fails — graceful degradation
      console.error('[AUTH] Failed to store refresh token hash:', dbErr.message);
    }

    delete user.password_hash;
    res.status(200).json({ message: 'Login berhasil!', user, token, refreshToken });
  } catch (error) {
    logError('LOGIN', error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server saat login.' });
  }
});

router.post('/token/refresh', refreshLimiter, async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token tidak disediakan.' });

  jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Token refresh tidak valid atau sudah kedaluwarsa' });

    try {
      // TASK-SEC-001: Verify refresh token exists in DB and is not revoked
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      const tokenResult = await pool.query(
        'SELECT id FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2 AND revoked = FALSE AND expires_at > NOW()',
        [tokenHash, decoded.id]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(403).json({ error: 'Token sudah tidak valid. Silakan login kembali.' });
      }

      const userResult = await pool.query('SELECT id, role FROM users WHERE id = $1', [decoded.id]);
      if (userResult.rows.length === 0) {
        return res.status(403).json({ error: 'User tidak ditemukan' });
      }

      const user = userResult.rows[0];
      const newAccessToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
      
      // Token rotation: revoke old, issue new refresh token
      const newRefreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET, { expiresIn: '7d' });
      const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Revoke old token and store new one in a transaction
      await pool.query('BEGIN');
      await pool.query('UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token_hash = $1', [tokenHash]);
      await pool.query(
        'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, newTokenHash, newExpiresAt]
      );
      await pool.query('COMMIT');

      res.json({ token: newAccessToken, refreshToken: newRefreshToken });
    } catch (dbErr) {
      await pool.query('ROLLBACK').catch(() => {});
      logError('REFRESH_TOKEN', dbErr);
      res.status(500).json({ error: 'Terjadi kesalahan pada server saat refresh token.' });
    }
  });
});

// ==========================================
// TASK-SEC-001: Logout with Token Revocation
// ==========================================
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.json({ message: 'Logged out (no token to revoke).' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await pool.query(
      'UPDATE refresh_tokens SET revoked = TRUE, revoked_at = NOW() WHERE token_hash = $1',
      [tokenHash]
    );
    
    // Audit log
    try {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.id) {
        await pool.query(
          'INSERT INTO audit_logs (user_id, action, resource_type, ip_address) VALUES ($1, $2, $3, $4)',
          [decoded.id, 'logout', 'auth', req.ip || null]
        );
      }
    } catch { /* audit log failure is non-critical */ }

    res.json({ message: 'Logout berhasil. Token telah direvokasi.' });
  } catch (error) {
    logError('LOGOUT', error);
    res.status(500).json({ error: 'Gagal melakukan logout.' });
  }
});

// Cek apakah email terdaftar (untuk proses ganti password langsung)
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email wajib diisi.' });

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email tidak terdaftar di sistem kami.' });
    }
    res.json({ message: 'Email ditemukan.' });
  } catch (error) {
    logError('CHECK_EMAIL', error);
    res.status(500).json({ error: 'Gagal mengecek email.' });
  }
});

// Reset password langsung berdasarkan email (Mode Demo/Bypass Verifikasi)
router.post('/direct-reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email dan kata sandi baru wajib diisi.' });
  }

  try {
    try {
      validatePassword(newPassword);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Email tidak ditemukan.' });
    }

    const userId = userResult.rows[0].id;
    const password_hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, userId]
    );

    res.json({ message: 'Kata sandi berhasil diperbarui! Silakan login.' });
  } catch (error) {
    logError('DIRECT_RESET_PASSWORD', error);
    res.status(500).json({ error: 'Gagal mereset kata sandi.' });
  }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Kata sandi lama dan baru wajib diisi.' });
    }
    
    // validate password strength if function exists
    try {
      validatePassword(newPassword);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });

    const user = userResult.rows[0];
    if (!user.password_hash) return res.status(400).json({ error: 'Akun ini tidak menggunakan kata sandi.' });

    const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Kata sandi saat ini salah.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, req.user.id]);

    res.json({ message: 'Kata sandi berhasil diperbarui.' });
  } catch (error) {
    logError('CHANGE_PASSWORD', error);
    res.status(500).json({ error: 'Gagal mengubah kata sandi.' });
  }
});

module.exports = router;
