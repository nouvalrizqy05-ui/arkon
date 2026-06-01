/**
 * Pagination Helper
 * Reusable pagination utilities untuk list endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express req.query
 * @returns {Object} { page, limit, offset, isValid }
 */
function parsePagination(query) {
  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 20;

  // Validate & sanitize
  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100; // Max 100 per page

  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    isValid: true
  };
}

/**
 * Format paginated response
 * @param {Array} rows - Result rows from database
 * @param {Object} pagination - From parsePagination()
 * @param {number} totalCount - Total records in database
 * @returns {Object} Paginated response
 */
function formatPaginatedResponse(rows, pagination, totalCount) {
  const totalPages = Math.ceil(totalCount / pagination.limit);
  
  return {
    data: rows,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalItems: totalCount,
      totalPages,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1
    }
  };
}

/**
 * SQL LIMIT/OFFSET clause generator
 * @param {Object} pagination - From parsePagination()
 * @returns {string} "LIMIT $X OFFSET $Y"
 */
function getPaginationClause(pageNum, pageSize) {
  return {
    limit: pageSize,
    offset: (pageNum - 1) * pageSize
  };
}

module.exports = {
  parsePagination,
  formatPaginatedResponse,
  getPaginationClause
};
