/**
 * ARKON Security Middleware Extras
 * NFR-SEC: HTTPS enforcement, CSP, additional hardening
 */

/**
 * Force HTTPS in production
 */
function enforceHttps(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') return next();
  res.redirect(301, `https://${req.headers.host}${req.url}`);
}

/**
 * Content Security Policy headers
 */
function contentSecurityPolicy(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://res.cloudinary.com https://ui-avatars.com",
    "connect-src 'self' https://generativelanguage.googleapis.com wss:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'"
  ].join('; '));
  next();
}

/**
 * Sanitize request body — strip null bytes, limit nested depth
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj, depth = 0) => {
      if (depth > 10) return {};
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'string') {
          result[k] = v.replace(/\0/g, '');
        } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
          result[k] = sanitize(v, depth + 1);
        } else {
          result[k] = v;
        }
      }
      return result;
    };
    req.body = sanitize(req.body);
  }
  next();
}

module.exports = { enforceHttps, contentSecurityPolicy, sanitizeBody };
