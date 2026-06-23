import { createFakeInventoryAdapter, createFakeOutletAdapter, createFakeMediaAdapter } from '../../../test/helpers/fake-domain-adapters.js';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('inventory adapter contract', () => {
  it('checkAvailability works', async () => {
    const inv = createFakeInventoryAdapter();
    const result = await inv.checkAvailability('p1', 'o1', 5);
    assert.ok(result.available);
    assert.strictEqual(result.quantity, 5);
  });

  it('reserveStock works', async () => {
    const inv = createFakeInventoryAdapter();
    const result = await inv.reserveStock('p1', 'o1', 5, 'ref-1');
    assert.ok(result.success);
  });
});

describe('outlet adapter contract', () => {
  it('getOutlet works', async () => {
    const o = createFakeOutletAdapter();
    const result = await o.getOutlet('o1');
    assert.strictEqual(result.name, 'Test Outlet');
  });
});

describe('media adapter contract', () => {
  it('getSignedUrl works', async () => {
    const m = createFakeMediaAdapter();
    const url = await m.getSignedUrl('asset-1');
    assert.ok(url.includes('cdn.test.com'));
  });
});
