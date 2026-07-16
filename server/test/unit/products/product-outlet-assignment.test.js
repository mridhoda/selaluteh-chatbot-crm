import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAssignedOutletIds } from '../../../src/services/product.service.js';

describe('product outlet assignment', () => {
  it('normalizes, removes empty values, and deduplicates selected outlets', () => {
    assert.deepEqual(getAssignedOutletIds({ outlets: [' outlet-a ', 'outlet-b', 'outlet-a', '', null] }), ['outlet-a', 'outlet-b']);
    assert.deepEqual(getAssignedOutletIds({}), []);
  });
});
