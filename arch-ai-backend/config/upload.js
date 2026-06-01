const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');

let upload;
let cloudinary = null;
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (useCloudinary) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Hanya file PDF yang diperbolehkan!'), false);
  };
  
  upload = multer({ storage: multer.memoryStorage(), fileFilter: pdfFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
  console.log('☁️ [Upload] Mode: Cloudinary Cloud Storage (SDK v2)');
} else {
  const uploadDir = path.join(__dirname, '../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const localStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => {
      // Security: Use random hex name to prevent path traversal via crafted filenames
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${randomBytes(8).toString('hex')}${ext}`;
      cb(null, safeName);
    }
  });

  const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Hanya file PDF yang diperbolehkan!'), false);
  };
  
  upload = multer({ storage: localStorage, fileFilter: pdfFileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
  console.log('💾 [Upload] Mode: Local Disk (set CLOUDINARY_* env vars untuk cloud)');
}

/**
 * TASK-SEC-002: Magic bytes validation middleware
 * Ensures the uploaded file is actually a PDF, not just renamed.
 * Checks for '%PDF-' (Hex: 25 50 44 46 2D) signature.
 */
const validatePdfMagicBytes = (req, res, next) => {
  if (!req.file) return next();

  try {
    let buffer;
    if (req.file.buffer) {
      // Memory storage (Cloudinary mode)
      buffer = req.file.buffer;
    } else if (req.file.path) {
      // Disk storage
      const fd = fs.openSync(req.file.path, 'r');
      buffer = Buffer.alloc(5);
      fs.readSync(fd, buffer, 0, 5, 0);
      fs.closeSync(fd);
    }

    if (buffer) {
      const hex = buffer.toString('hex', 0, 5).toUpperCase();
      // %PDF- = 25 50 44 46 2D
      if (hex !== '255044462D') {
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path); // Clean up fake file
        }
        return res.status(400).json({ error: 'File ditolak: Bukan file PDF valid (Magic bytes mismatch).' });
      }
    }
    next();
  } catch (err) {
    console.error('🔥 [Upload] Magic bytes check error:', err);
    res.status(500).json({ error: 'Gagal memvalidasi file' });
  }
};

/**
 * Custom error handler for multer
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Ukuran file melebihi batas maksimal (10MB).' });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = { upload, cloudinary, useCloudinary, validatePdfMagicBytes, handleUploadError };
