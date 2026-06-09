/**
 * ARKON Sentry Error Monitoring
 * NFR-AVAIL: Error tracking untuk production observability
 * 
 * Setup: https://sentry.io → New Project → Node.js
 * Dapatkan DSN di Project Settings → Client Keys
 */

let Sentry = null;

function initSentry() {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.info('ℹ️ [Sentry] SENTRY_DSN not set — error monitoring disabled');
    return null;
  }

  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: `arkon@${require('../package.json').version || '1.0.0'}`,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod
      integrations: [
        Sentry.httpIntegration(),
      ],
      beforeSend(event) {
        // Sanitize: remove sensitive fields before sending to Sentry
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        return event;
      }
    });
    console.log('✅ [Sentry] Error monitoring initialized');
    return Sentry;
  } catch (err) {
    console.warn('⚠️ [Sentry] Failed to initialize:', err.message);
    return null;
  }
}

/**
 * Express error handler middleware for Sentry
 * Must be registered AFTER all routes
 */
function sentryErrorHandler() {
  if (!Sentry) {
    // Passthrough if Sentry not available
    return (err, req, res, next) => next(err);
  }
  return Sentry.expressErrorHandler();
}

/**
 * Manual error capture (for caught errors in try/catch)
 */
function captureError(error, context = {}) {
  if (!Sentry) return;
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
    Sentry.captureException(error);
  });
}

/**
 * Sentry health info for /api/health
 */
function getSentryHealth() {
  return {
    status: Sentry ? 'enabled' : 'disabled',
    message: Sentry ? 'Error monitoring active' : 'SENTRY_DSN not configured'
  };
}

module.exports = { initSentry, sentryErrorHandler, captureError, getSentryHealth };
