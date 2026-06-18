/**
 * supabase-errors.test.js
 *
 * Unit tests for Supabase/Postgres error mapping helpers.
 * No database or Supabase connection required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapSupabaseError,
  extractData,
  extractSingle,
  assertFound,
  PG_ERRORS,
} from '../../../src/db/supabase-errors.js';
import { AppError } from '../../../src/utils/errors.js';

describe('supabase-errors', () => {
  describe('mapSupabaseError', () => {
    it('returns null for null error', () => {
      assert.strictEqual(mapSupabaseError(null), null);
    });

    it('maps unique_violation (23505) to DUPLICATE 409', () => {
      const err = mapSupabaseError({ code: PG_ERRORS.UNIQUE_VIOLATION, message: 'dup', details: 'x' });
      assert.ok(err instanceof AppError);
      assert.equal(err.code, 'DUPLICATE');
      assert.equal(err.status, 409);
    });

    it('maps foreign_key_violation (23503) to REFERENCE_NOT_FOUND 400', () => {
      const err = mapSupabaseError({ code: PG_ERRORS.FOREIGN_KEY_VIOLATION, message: 'fk' });
      assert.equal(err.code, 'REFERENCE_NOT_FOUND');
      assert.equal(err.status, 400);
    });

    it('maps not_null_violation (23502) to VALIDATION_ERROR 400', () => {
      const err = mapSupabaseError({ code: PG_ERRORS.NOT_NULL_VIOLATION, message: 'nn' });
      assert.equal(err.code, 'VALIDATION_ERROR');
      assert.equal(err.status, 400);
    });

    it('maps PGRST116 (no rows) to null (not an error)', () => {
      const result = mapSupabaseError({ code: PG_ERRORS.PGRST_NO_ROWS, message: 'no rows' });
      assert.strictEqual(result, null);
    });

    it('maps unknown error to DATABASE_ERROR 500', () => {
      const err = mapSupabaseError({ code: 'UNKNOWN_CODE', message: 'boom' });
      assert.equal(err.code, 'DATABASE_ERROR');
      assert.equal(err.status, 500);
    });

    it('includes context in error label', () => {
      const err = mapSupabaseError({ code: 'UNKNOWN_CODE', message: 'boom' }, 'users.findById');
      assert.ok(err.message.includes('users.findById'));
    });
  });

  describe('extractData', () => {
    it('returns data when no error', () => {
      const result = { data: [{ id: 1 }], error: null };
      assert.deepEqual(extractData(result), [{ id: 1 }]);
    });

    it('throws AppError when error is present', () => {
      const result = { data: null, error: { code: PG_ERRORS.UNIQUE_VIOLATION, message: 'dup' } };
      assert.throws(() => extractData(result), AppError);
    });
  });

  describe('extractSingle', () => {
    it('returns data when no error', () => {
      const result = { data: { id: 1 }, error: null };
      assert.deepEqual(extractSingle(result), { id: 1 });
    });

    it('returns null for PGRST116 (no rows)', () => {
      const result = { data: null, error: { code: PG_ERRORS.PGRST_NO_ROWS, message: 'no rows' } };
      assert.strictEqual(extractSingle(result), null);
    });

    it('returns null when data is null and no error', () => {
      const result = { data: null, error: null };
      assert.strictEqual(extractSingle(result), null);
    });

    it('throws AppError for real errors', () => {
      const result = { data: null, error: { code: PG_ERRORS.UNIQUE_VIOLATION, message: 'dup' } };
      assert.throws(() => extractSingle(result), AppError);
    });
  });

  describe('assertFound', () => {
    it('returns the row when present', () => {
      const row = { id: 'abc' };
      assert.deepEqual(assertFound(row, 'User'), row);
    });

    it('throws NOT_FOUND 404 for null', () => {
      assert.throws(
        () => assertFound(null, 'User'),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.code, 'NOT_FOUND');
          assert.equal(err.status, 404);
          assert.ok(err.message.includes('User'));
          return true;
        },
      );
    });

    it('throws NOT_FOUND 404 for undefined', () => {
      assert.throws(() => assertFound(undefined, 'Outlet'), AppError);
    });

    it('uses default label when none provided', () => {
      assert.throws(
        () => assertFound(null),
        (err) => {
          assert.ok(err.message.includes('Record'));
          return true;
        },
      );
    });
  });
});
