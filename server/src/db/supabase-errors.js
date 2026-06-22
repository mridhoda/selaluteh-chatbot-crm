/**
 * supabase-errors.js
 *
 * Maps Supabase SDK errors and Postgres error codes to canonical AppError instances.
 * Repositories call these helpers instead of letting Supabase errors leak into services.
 *
 * Postgres error codes reference:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 *
 * Supabase PostgREST error codes:
 * PGRST116 = "The result contains 0 rows" (single row expected, none found)
 */

import { AppError } from '../utils/errors.js';

/**
 * Postgres / PostgREST error code constants.
 */
export const PG_ERRORS = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
  EXCLUSION_VIOLATION: '23P01',
  INVALID_TEXT_REPRESENTATION: '22P02',
  PGRST_NO_ROWS: 'PGRST116',
};

/**
 * Map a Supabase SDK error object to an AppError.
 * Returns null if the error is a "no rows found" non-error.
 *
 * @param {import('@supabase/supabase-js').PostgrestError | Error} error
 * @param {string} [context] - optional context label for logging (e.g. 'users.findById')
 * @returns {AppError}
 */
export function mapSupabaseError(error, context = '') {
  if (!error) return null;

  const code = error.code || error.status;
  const ctx = context ? ` [${context}]` : '';

  switch (code) {
    case PG_ERRORS.UNIQUE_VIOLATION:
      return new AppError('DUPLICATE', `Duplicate record${ctx}`, 409, {
        detail: error.details || error.message,
      });

    case PG_ERRORS.FOREIGN_KEY_VIOLATION:
      return new AppError('REFERENCE_NOT_FOUND', `Referenced record not found${ctx}`, 400, {
        detail: error.details || error.message,
      });

    case PG_ERRORS.NOT_NULL_VIOLATION:
      return new AppError('VALIDATION_ERROR', `Missing required field${ctx}`, 400, {
        detail: error.details || error.message,
      });

    case PG_ERRORS.CHECK_VIOLATION:
    case PG_ERRORS.EXCLUSION_VIOLATION:
      return new AppError('VALIDATION_ERROR', `Constraint violation${ctx}`, 400, {
        detail: error.details || error.message,
      });

    case PG_ERRORS.INVALID_TEXT_REPRESENTATION:
      return new AppError('VALIDATION_ERROR', `Invalid input syntax${ctx}`, 400, {
        detail: error.details || error.message,
      });

    case PG_ERRORS.PGRST_NO_ROWS:
      // PostgREST returns this for .single() with no result — treat as null, not error
      return null;

    default:
      return new AppError(
        'DATABASE_ERROR',
        `Database operation failed${ctx}`,
        500,
        { code, detail: error.message },
        error,
      );
  }
}

/**
 * Handle a Supabase result object { data, error }.
 * Throws AppError on error, returns data on success.
 *
 * @param {{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }} result
 * @param {string} [context]
 * @returns {unknown} result.data
 */
export function extractData(result, context = '') {
  if (result.error) {
    const mapped = mapSupabaseError(result.error, context);
    if (mapped) throw mapped;
  }
  return result.data;
}

/**
 * Handle a Supabase single-row result { data, error }.
 * Returns null for PGRST116 (no rows). Throws for real errors.
 *
 * @param {{ data: unknown, error: import('@supabase/supabase-js').PostgrestError | null }} result
 * @param {string} [context]
 * @returns {unknown | null} result.data or null
 */
export function extractSingle(result, context = '') {
  if (result.error) {
    if (result.error.code === PG_ERRORS.PGRST_NO_ROWS) return null;
    const mapped = mapSupabaseError(result.error, context);
    if (mapped) throw mapped;
  }
  return result.data ?? null;
}

/**
 * Assert a row was found — throw 404 AppError if null.
 *
 * @param {unknown} row
 * @param {string} label - human-readable resource label (e.g. 'User', 'Outlet')
 * @returns {unknown} the row unchanged
 */
export function assertFound(row, label = 'Record') {
  if (row === null || row === undefined) {
    throw new AppError('NOT_FOUND', `${label} not found`, 404);
  }
  return row;
}
