/**
 * supabase-query.js
 *
 * Shared repository query conventions and scoping helpers for Supabase-backed repositories.
 *
 * All Supabase repositories must:
 * 1. Enforce workspace_id scope for every tenant-owned query.
 * 2. Enforce outlet_id scope for outlet-scoped operations.
 * 3. Never return cross-workspace data.
 * 4. Use these helpers to keep scoping consistent and auditable.
 */

import { AppError } from '../utils/errors.js';

/**
 * Assert that workspaceId is present.
 * All tenant-owned repository calls must pass this check.
 *
 * @param {string | undefined} workspaceId
 * @throws {AppError} if workspaceId is missing or not a string
 */
export function requireWorkspaceId(workspaceId) {
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new AppError(
      'MISSING_WORKSPACE_SCOPE',
      'workspaceId is required for this operation',
      500,
    );
  }
}

/**
 * Assert that outletId is present.
 * All outlet-scoped repository calls must pass this check.
 *
 * @param {string | undefined} outletId
 * @throws {AppError} if outletId is missing
 */
export function requireOutletId(outletId) {
  if (!outletId || typeof outletId !== 'string') {
    throw new AppError(
      'MISSING_OUTLET_SCOPE',
      'outletId is required for this operation',
      500,
    );
  }
}

/**
 * Apply workspace_id equality filter to a Supabase query builder.
 * Returns the query with .eq('workspace_id', workspaceId) applied.
 *
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {string} workspaceId
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export function withWorkspace(query, workspaceId) {
  requireWorkspaceId(workspaceId);
  return query.eq('workspace_id', workspaceId);
}

/**
 * Apply outlet_id equality filter to a Supabase query builder.
 *
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {string} outletId
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export function withOutlet(query, outletId) {
  requireOutletId(outletId);
  return query.eq('outlet_id', outletId);
}

/**
 * Apply pagination (offset + limit) to a Supabase query builder.
 *
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {{ page?: number, limit?: number }} options
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export function applyPagination(query, { page = 1, limit = 20 } = {}) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
  const from = (safePage - 1) * safeLimit;
  const to = from + safeLimit - 1;
  return query.range(from, to);
}

/**
 * Apply a soft text search filter using ilike (case-insensitive).
 *
 * @param {import('@supabase/supabase-js').PostgrestFilterBuilder} query
 * @param {string} column - DB column name (snake_case)
 * @param {string | undefined} search
 * @returns {import('@supabase/supabase-js').PostgrestFilterBuilder}
 */
export function withSearch(query, column, search) {
  if (!search || !search.trim()) return query;
  return query.ilike(column, `%${search.trim()}%`);
}

/**
 * Build safe pagination metadata for API responses.
 *
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {{ total: number, page: number, limit: number, totalPages: number, hasNext: boolean, hasPrev: boolean }}
 */
export function paginationMeta(total, page, limit) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.ceil(total / safeLimit);
  return {
    total,
    page: safePage,
    limit: safeLimit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
