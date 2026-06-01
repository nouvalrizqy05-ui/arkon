const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('⚠️ [Auth] No token provided');
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login kembali.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ [Auth] Invalid/Expired token:', err.message);
      return res.status(403).json({ error: 'Token tidak valid atau kedaluwarsa.' });
    }
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autentikasi diperlukan.' });
    }
    if (!roles.includes(req.user.role)) {
      console.warn(`⛔ [Auth] Access denied for role: ${req.user.role}. Required: ${roles.join(' or ')}`);
      return res.status(403).json({ error: 'Anda tidak memiliki izin untuk melakukan aksi ini.' });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
