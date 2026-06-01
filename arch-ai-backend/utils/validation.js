/**
 * Input Validation Helpers
 * Centralized validation functions untuk input sanitization & validation
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Identifier number regex (NIM/NPM format)
const IDENTIFIER_REGEX = /^[0-9A-Za-z\-]{3,50}$/;

// Safe string validation
function validateString(value, minLength = 1, maxLength = 255, fieldName = 'field') {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} harus berupa text.`);
  }
  
  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    throw new Error(`${fieldName} minimal ${minLength} karakter.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} maksimal ${maxLength} karakter.`);
  }
  
  return trimmed;
}

// Email validation
function validateEmail(email) {
  if (!email || !EMAIL_REGEX.test(email)) {
    throw new Error('Format email tidak valid.');
  }
  return email.toLowerCase();
}

// Full name validation
function validateFullName(name) {
  const validated = validateString(name, 3, 100, 'Nama lengkap');
  if (validated.split(' ').length < 2) {
    throw new Error('Nama lengkap minimal 2 kata.');
  }
  return validated;
}

// Identifier (NIM/NPM) validation
function validateIdentifier(identifier) {
  const validated = validateString(identifier, 3, 50, 'Nomor identitas');
  if (!IDENTIFIER_REGEX.test(validated)) {
    throw new Error('Format nomor identitas tidak valid (gunakan angka/huruf/dash).');
  }
  return validated;
}

// Password validation (minimum 8 chars, mixed case, number, special char)
function validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password minimal 8 karakter.');
  }
  if (!/[a-z]/.test(password)) {
    throw new Error('Password harus mengandung huruf kecil.');
  }
  if (!/[A-Z]/.test(password)) {
    throw new Error('Password harus mengandung huruf besar.');
  }
  if (!/[0-9]/.test(password)) {
    throw new Error('Password harus mengandung angka.');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    throw new Error('Password harus mengandung karakter spesial (!@#$%^&*).');
  }
  return password;
}

// Integer validation (coin amounts, etc)
function validateInteger(value, minValue = 0, maxValue = 999999, fieldName = 'field') {
  const parsed = parseInt(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${fieldName} harus berupa angka.`);
  }
  if (parsed < minValue || parsed > maxValue) {
    throw new Error(`${fieldName} harus antara ${minValue}-${maxValue}.`);
  }
  return parsed;
}

// Enum validation (role, status, etc)
function validateEnum(value, allowedValues, fieldName = 'field') {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} harus salah satu dari: ${allowedValues.join(', ')}.`);
  }
  return value;
}

// UUID validation
function validateUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new Error('Format UUID tidak valid.');
  }
  return uuid;
}

// Batch validator wrapper
function createValidator(rules) {
  return (data) => {
    const errors = [];
    const validated = {};

    for (const [field, rule] of Object.entries(rules)) {
      try {
        if (rule.required && !data[field]) {
          throw new Error(`${field} wajib diisi.`);
        }

        if (data[field]) {
          if (rule.type === 'email') {
            validated[field] = validateEmail(data[field]);
          } else if (rule.type === 'string') {
            validated[field] = validateString(data[field], rule.min || 1, rule.max || 255, field);
          } else if (rule.type === 'integer') {
            validated[field] = validateInteger(data[field], rule.min || 0, rule.max || 999999, field);
          } else if (rule.type === 'enum') {
            validated[field] = validateEnum(data[field], rule.values || [], field);
          } else if (rule.type === 'uuid') {
            validated[field] = validateUUID(data[field]);
          } else if (rule.custom) {
            validated[field] = rule.custom(data[field], field);
          }
        }
      } catch (err) {
        errors.push(err.message);
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(' '));
    }

    return validated;
  };
}

module.exports = {
  validateString,
  validateEmail,
  validateFullName,
  validateIdentifier,
  validatePassword,
  validateInteger,
  validateEnum,
  validateUUID,
  createValidator
};
