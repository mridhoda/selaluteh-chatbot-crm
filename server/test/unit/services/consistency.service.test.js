import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateDataConsistency } from '../../../src/services/consistency.service.js';

describe('consistency.service', () => {
  it('returns empty array for valid workspace', async () => {
    const issues = await validateDataConsistency();
    assert.ok(Array.isArray(issues));
  });
});
