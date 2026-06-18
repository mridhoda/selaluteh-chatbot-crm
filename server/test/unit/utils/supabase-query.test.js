/**
 * supabase-query.test.js
 *
 * Unit tests for Supabase repository query convention helpers.
 * No database connection required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  requireWorkspaceId,
  requireOutletId,
  paginationMeta,
  withSearch,
} from '../../../src/db/supabase-query.js';
import { AppError } from '../../../src/utils/errors.js';

describe('supabase-query', () => {
  describe('requireWorkspaceId', () => {
    it('does not throw when workspaceId is a valid string', () => {
      assert.doesNotThrow(() => requireWorkspaceId('550e8400-e29b-41d4-a716-446655440000'));
    });

    it('throws MISSING_WORKSPACE_SCOPE for null', () => {
      assert.throws(
        () => requireWorkspaceId(null),
        (err) => {
          assert.ok(err instanceof AppError);
          assert.equal(err.code, 'MISSING_WORKSPACE_SCOPE');
          assert.equal(err.status, 500);
          return true;
        },
      );
    });

    it('throws MISSING_WORKSPACE_SCOPE for undefined', () => {
      assert.throws(() => requireWorkspaceId(undefined), AppError);
    });

    it('throws MISSING_WORKSPACE_SCOPE for empty string', () => {
      assert.throws(() => requireWorkspaceId(''), AppError);
    });

    it('throws MISSING_WORKSPACE_SCOPE for non-string', () => {
      assert.throws(() => requireWorkspaceId(12345), AppError);
    });
  });

  describe('requireOutletId', () => {
    it('does not throw for valid string', () => {
      assert.doesNotThrow(() => requireOutletId('outlet-id-123'));
    });

    it('throws MISSING_OUTLET_SCOPE for null', () => {
      assert.throws(
        () => requireOutletId(null),
        (err) => {
          assert.equal(err.code, 'MISSING_OUTLET_SCOPE');
          return true;
        },
      );
    });
  });

  describe('paginationMeta', () => {
    it('calculates totalPages correctly', () => {
      const meta = paginationMeta(50, 1, 20);
      assert.equal(meta.totalPages, 3);
      assert.equal(meta.total, 50);
      assert.equal(meta.page, 1);
      assert.equal(meta.limit, 20);
    });

    it('hasNext is true when not last page', () => {
      const meta = paginationMeta(50, 1, 20);
      assert.equal(meta.hasNext, true);
      assert.equal(meta.hasPrev, false);
    });

    it('hasPrev is true when not first page', () => {
      const meta = paginationMeta(50, 2, 20);
      assert.equal(meta.hasPrev, true);
    });

    it('hasNext is false on last page', () => {
      const meta = paginationMeta(40, 2, 20);
      assert.equal(meta.hasNext, false);
    });

    it('handles total = 0', () => {
      const meta = paginationMeta(0, 1, 20);
      assert.equal(meta.totalPages, 0);
      assert.equal(meta.hasNext, false);
      assert.equal(meta.hasPrev, false);
    });

    it('handles exact division', () => {
      const meta = paginationMeta(20, 1, 20);
      assert.equal(meta.totalPages, 1);
      assert.equal(meta.hasNext, false);
    });

    it('enforces minimum page 1', () => {
      const meta = paginationMeta(10, 0, 5);
      assert.equal(meta.page, 1);
    });
  });

  describe('withSearch', () => {
    // withSearch returns the modified query builder.
    // We simulate a simple query builder mock to test behavior.

    function mockQuery() {
      const calls = [];
      const q = {
        ilike(column, pattern) {
          calls.push({ column, pattern });
          return q;
        },
        _calls: calls,
      };
      return q;
    }

    it('applies ilike filter when search is provided', () => {
      const q = mockQuery();
      const result = withSearch(q, 'name', 'alice');
      assert.equal(result._calls.length, 1);
      assert.equal(result._calls[0].column, 'name');
      assert.equal(result._calls[0].pattern, '%alice%');
    });

    it('trims whitespace from search term', () => {
      const q = mockQuery();
      withSearch(q, 'name', '  bob  ');
      assert.equal(q._calls[0].pattern, '%bob%');
    });

    it('returns query unchanged when search is empty string', () => {
      const q = mockQuery();
      const result = withSearch(q, 'name', '');
      assert.equal(result._calls.length, 0);
    });

    it('returns query unchanged when search is undefined', () => {
      const q = mockQuery();
      const result = withSearch(q, 'name', undefined);
      assert.equal(result._calls.length, 0);
    });

    it('returns query unchanged when search is whitespace only', () => {
      const q = mockQuery();
      withSearch(q, 'name', '   ');
      assert.equal(q._calls.length, 0);
    });
  });
});
