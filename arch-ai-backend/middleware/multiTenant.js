/**
 * ARKON Multi-Tenant Middleware — F-010
 * Enforces institution-level data isolation.
 * 
 * If user has institution_id, all room queries are automatically
 * scoped to that institution. Prevents data leakage between PT.
 */
const pool = require('../config/db');

/**
 * Resolves the institution_id for a user and attaches to req.
 * Subsequent middleware/routes can use req.institutionId for scoping.
 */
async function resolveInstitution(req, res, next) {
  // Skip if no user (unauthenticated routes)
  if (!req.user?.id) return next();

  try {
    // Use cached value if already resolved (within same request)
    if (req.institutionId !== undefined) return next();

    const result = await pool.query(
      'SELECT institution_id FROM users WHERE id = $1',
      [req.user.id]
    );

    req.institutionId = result.rows[0]?.institution_id || null;
    next();
  } catch (err) {
    console.error('[MultiTenant] Failed to resolve institution:', err.message);
    // Non-blocking: don't fail the request if institution lookup fails
    req.institutionId = null;
    next();
  }
}

/**
 * Factory: returns middleware that scopes a query's WHERE clause
 * to the user's institution if institution_id is present.
 * 
 * Usage in routes:
 *   const scope = buildInstitutionScope(req, 'r');
 *   // scope.where => 'r.institution_id = $N' or ''
 *   // scope.params => [institutionId] or []
 */
function buildInstitutionScope(req, tableAlias = '') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (!req.institutionId) {
    return { where: '', params: [], hasScope: false };
  }
  return {
    where: `${prefix}institution_id = $`,
    params: [req.institutionId],
    hasScope: true,
    institutionId: req.institutionId
  };
}

/**
 * Guard: rejects request if user tries to access another institution's resource.
 * Use after resolveInstitution.
 */
async function assertSameInstitution(req, res, resourceInstitutionId) {
  if (!req.institutionId) return true; // no scoping in single-tenant mode
  if (resourceInstitutionId === null) return true; // resource has no institution
  if (req.institutionId !== resourceInstitutionId) {
    res.status(403).json({ error: 'Akses ditolak: resource milik institusi lain.' });
    return false;
  }
  return true;
}

module.exports = { resolveInstitution, buildInstitutionScope, assertSameInstitution };
