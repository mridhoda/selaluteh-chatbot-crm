/**
 * supabase-mapper.test.js
 *
 * Unit tests for camelCase ↔ snake_case mapping helpers.
 * No database or Supabase connection required.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  camelToSnake,
  snakeToCamel,
  toSnakeCase,
  toCamelCase,
  mapRow,
  mapRows,
} from '../../../src/db/supabase-mapper.js';

describe('supabase-mapper', () => {
  describe('camelToSnake', () => {
    it('converts simple camelCase', () => {
      assert.equal(camelToSnake('workspaceId'), 'workspace_id');
    });

    it('converts consecutive uppercase words', () => {
      assert.equal(camelToSnake('planExpiry'), 'plan_expiry');
    });

    it('converts deeper nesting', () => {
      assert.equal(camelToSnake('passwordHash'), 'password_hash');
    });

    it('leaves already snake_case unchanged', () => {
      assert.equal(camelToSnake('workspace_id'), 'workspace_id');
    });

    it('handles single word', () => {
      assert.equal(camelToSnake('name'), 'name');
    });

    it('handles multi-segment like lastLoginAt', () => {
      assert.equal(camelToSnake('lastLoginAt'), 'last_login_at');
    });
  });

  describe('snakeToCamel', () => {
    it('converts simple snake_case', () => {
      assert.equal(snakeToCamel('workspace_id'), 'workspaceId');
    });

    it('converts multi-segment', () => {
      assert.equal(snakeToCamel('last_login_at'), 'lastLoginAt');
    });

    it('leaves already camelCase unchanged', () => {
      assert.equal(snakeToCamel('workspaceId'), 'workspaceId');
    });

    it('handles single word', () => {
      assert.equal(snakeToCamel('name'), 'name');
    });
  });

  describe('toSnakeCase', () => {
    it('converts all keys to snake_case', () => {
      const input = { workspaceId: 'abc', passwordHash: 'xyz', name: 'Alice' };
      const result = toSnakeCase(input);
      assert.deepEqual(result, { workspace_id: 'abc', password_hash: 'xyz', name: 'Alice' });
    });

    it('preserves null values', () => {
      const result = toSnakeCase({ planExpiry: null });
      assert.deepEqual(result, { plan_expiry: null });
    });

    it('skips undefined values', () => {
      const result = toSnakeCase({ name: 'Bob', email: undefined });
      assert.ok(!('email' in result));
      assert.equal(result.name, 'Bob');
    });

    it('returns null for null input', () => {
      assert.strictEqual(toSnakeCase(null), null);
    });

    it('returns array unchanged', () => {
      const arr = [1, 2, 3];
      assert.deepEqual(toSnakeCase(arr), arr);
    });
  });

  describe('toCamelCase / mapRow', () => {
    it('converts DB row snake_case to camelCase', () => {
      const row = {
        workspace_id: 'wid',
        password_hash: 'hash',
        last_login_at: '2026-01-01',
        name: 'Alice',
      };
      const result = toCamelCase(row);
      assert.deepEqual(result, {
        workspaceId: 'wid',
        passwordHash: 'hash',
        lastLoginAt: '2026-01-01',
        name: 'Alice',
      });
    });

    it('preserves null values', () => {
      const result = mapRow({ plan_expiry: null });
      assert.deepEqual(result, { planExpiry: null });
    });

    it('skips undefined values', () => {
      const result = mapRow({ name: 'Bob', email: undefined });
      assert.ok(!('email' in result));
    });

    it('returns null for null input', () => {
      assert.strictEqual(mapRow(null), null);
    });
  });

  describe('mapRows', () => {
    it('maps an array of DB rows', () => {
      const rows = [
        { workspace_id: 'a', name: 'Alice' },
        { workspace_id: 'b', name: 'Bob' },
      ];
      const result = mapRows(rows);
      assert.equal(result.length, 2);
      assert.equal(result[0].workspaceId, 'a');
      assert.equal(result[1].workspaceId, 'b');
      assert.ok(!('workspace_id' in result[0]));
    });

    it('returns empty array for empty input', () => {
      assert.deepEqual(mapRows([]), []);
    });

    it('returns empty array for non-array input', () => {
      assert.deepEqual(mapRows(null), []);
    });
  });

  describe('roundtrip', () => {
    it('camelCase → snake_case → camelCase roundtrip is lossless', () => {
      const original = {
        workspaceId: 'w1',
        passwordHash: 'h1',
        lastLoginAt: '2026-06-18T00:00:00Z',
        planExpiry: null,
        name: 'Test',
      };
      const snaked = toSnakeCase(original);
      const cameled = toCamelCase(snaked);
      assert.deepEqual(cameled, original);
    });
  });
});
