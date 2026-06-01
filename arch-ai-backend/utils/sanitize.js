/**
 * ARKON HTML Sanitizer — XSS Prevention for Email Templates & User Content
 * 
 * Provides functions to sanitize user input before embedding in HTML contexts
 * (email templates, rendered content, etc.)
 */

/**
 * Escape HTML entities to prevent XSS in HTML contexts
 * @param {string} str - Raw user input
 * @returns {string} Escaped HTML-safe string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Strip all HTML tags from a string
 * @param {string} str - String potentially containing HTML
 * @returns {string} Plain text with no HTML tags
 */
function stripHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize a URL to prevent javascript: protocol XSS
 * @param {string} url - URL to validate
 * @returns {string|null} Safe URL or null if malicious
 */
function sanitizeUrl(url) {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:') || trimmed.startsWith('vbscript:')) {
    return null;
  }
  return url;
}

module.exports = { escapeHtml, stripHtml, sanitizeUrl };
