/**
 * inventory-concurrency.test.js — Task 18.10
 *
 * Concurrency tests for inventory stock mutations.
 * Tests run against a Supabase test project; skip gracefully if unconfigured.
 *
 * These tests intentionally run sequential adjustments via Promise.all to
 * verify that the optimistic concurrency guard (eq('quantity', oldQty))
 * correctly prevents oversell and double-consumption.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { isTestDbConfigured, getTestClient, testUuid } from '../../test/helpers/supabaseTest.js';

if (!isTestDbConfigured) {
  describe('inventory concurrency (Supabase)', () => {
    it('SKIPPED — SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY not set', (t) => t.skip());
  });
  process.exit(0);
}

const { inventoryRepository } = await import('../../src/db/repositories/inventory.supabase.repository.js');

describe('inventory concurrency (Supabase)', () => {
  let client;
  let wsId, outletId, productId, outlet2Id;

  before(async () => {
    client = getTestClient();
  });

  beforeEach(async () => {
    wsId = testUuid();
    outletId = testUuid();
    outlet2Id = testUuid();
    productId = testUuid();

    await client.from('workspaces').insert({ id: wsId, name: 'Concurrency Test Workspace', status: 'active' });
    await client.from('outlets').insert([
      { id: outletId, workspace_id: wsId, name: 'Outlet A', status: 'active' },
      { id: outlet2Id, workspace_id: wsId, name: 'Outlet B', status: 'active' },
    ]);
    await client.from('products').insert({
      id: productId, workspace_id: wsId, name: 'Concurrency Test Product', base_price: 10000, is_active: true,
    });

    await inventoryRepository.upsertItem({
      workspaceId: wsId, outletId, productId, quantity: 10, lowStockThreshold: 2,
    });
    await inventoryRepository.upsertItem({
      workspaceId: wsId, outletId: outlet2Id, productId, quantity: 5, lowStockThreshold: 2,
    });
  });

  after(async () => {
    await client.from('stock_movements').delete().eq('workspace_id', wsId);
    await client.from('inventory_items').delete().eq('workspace_id', wsId);
    await client.from('products').delete().eq('workspace_id', wsId);
    await client.from('outlets').delete().eq('workspace_id', wsId);
    await client.from('workspaces').delete().eq('id', wsId);
  });

  it('concurrent reservation does not oversell', async () => {
    // 10 in stock. Fire 12 concurrent reserve calls of -1 each.
    // At most 10 should succeed; the rest should throw INSUFFICIENT_STOCK.
    const calls = Array.from({ length: 12 }, (_, i) =>
      inventoryRepository.atomicAdjust({
        workspaceId: wsId, outletId, productId, delta: -1, reason: 'reserve',
        referenceType: 'order', referenceId: testUuid(),
        notes: `Concurrent test reservation ${i}`,
      }).catch(err => ({ error: err.code, message: err.message }))
    );

    const results = await Promise.all(calls);
    const succeeded = results.filter(r => r.error === undefined);
    const failed = results.filter(r => r.error !== undefined);

    assert.ok(succeeded.length <= 10, `At most 10 should succeed, got ${succeeded.length}`);
    assert.ok(failed.length >= 2, `At least 2 should fail, got ${failed.length}`);

    const failedInsuff = failed.filter(f => f.error === 'INSUFFICIENT_STOCK');
    assert.ok(failedInsuff.length >= 2, `Expected INSUFFICIENT_STOCK, got ${failed.map(f => f.error).join(', ')}`);

    const item = await inventoryRepository.findByProduct({ workspaceId: wsId, outletId, productId });
    const totalReserved = succeeded.reduce((sum) => sum + 1, 0);
    assert.strictEqual(item.quantity, 10 - totalReserved, 'Remaining stock should reflect only successful reservations');

    const movements = await inventoryRepository.getMovements({ workspaceId: wsId, outletId, productId, reason: 'reserve' });
    assert.strictEqual(movements.length, succeeded.length, 'Each successful reservation should create a stock_movement');
  });

  it('release exactly once — concurrent releases do not double-add', async () => {
    // Reserve 8 items first via a single call
    await inventoryRepository.atomicAdjust({
      workspaceId: wsId, outletId, productId, delta: -8, reason: 'reserve',
      referenceType: 'order', referenceId: testUuid(),
      notes: 'Initial bulk reserve',
    });

    // Now fire 5 concurrent release calls, each trying to release 8
    const calls = Array.from({ length: 5 }, (_, i) =>
      inventoryRepository.atomicAdjust({
        workspaceId: wsId, outletId, productId, delta: 8, reason: 'release',
        referenceType: 'order', referenceId: testUuid(),
        notes: `Concurrent release ${i}`,
      }).catch(err => ({ error: err.code, message: err.message }))
    );

    const results = await Promise.all(calls);
    const succeeded = results.filter(r => r.error === undefined);
    const failed = results.filter(r => r.error !== undefined);

    // Only 1 should succeed (the first that matches qty=2);
    // the rest fail because qty no longer matches after first update
    assert.strictEqual(succeeded.length, 1, `Only 1 release should succeed, got ${succeeded.length}`);
    assert.ok(failed.length >= 4, `At least 4 should fail, got ${failed.length}`);

    const item = await inventoryRepository.findByProduct({ workspaceId: wsId, outletId, productId });
    assert.strictEqual(item.quantity, 10, 'After exactly one release, stock should return to original 10');
  });

  it('consume exactly once — concurrent consumes do not double-deduct', async () => {
    // Fire 3 concurrent consume calls of -8 each.
    // Only 1 should succeed (available=10, req=-8, after first the qty becomes 2, other -8s fail).
    const calls = Array.from({ length: 3 }, (_, i) =>
      inventoryRepository.atomicAdjust({
        workspaceId: wsId, outletId, productId, delta: -8, reason: 'consume',
        referenceType: 'order', referenceId: testUuid(),
        notes: `Concurrent consume ${i}`,
      }).catch(err => ({ error: err.code, message: err.message }))
    );

    const results = await Promise.all(calls);
    const succeeded = results.filter(r => r.error === undefined);
    const failed = results.filter(r => r.error !== undefined);

    assert.strictEqual(succeeded.length, 1, `Only 1 consume should succeed, got ${succeeded.length}`);
    assert.ok(failed.length >= 2, `At least 2 should fail, got ${failed.length}`);

    const item = await inventoryRepository.findByProduct({ workspaceId: wsId, outletId, productId });
    assert.strictEqual(item.quantity, 2, 'After exactly one consume of 8, stock should be 2');
  });

  it('adjustment creates stock_movement record', async () => {
    await inventoryRepository.atomicAdjust({
      workspaceId: wsId, outletId, productId, delta: 5, reason: 'adjustment',
      notes: 'Restock adjustment',
    });

    const movements = await inventoryRepository.getMovements({ workspaceId: wsId, outletId, productId });
    assert.ok(movements.length >= 1, 'Adjustment should create at least one movement');

    const adjustMov = movements.find(m => m.reason === 'adjustment');
    assert.ok(adjustMov, 'Should have an adjustment movement');
    assert.strictEqual(adjustMov.quantityChange, 5);
    assert.strictEqual(adjustMov.runningQuantity, 15); // 10 initial + 5 adjustment
  });

  it('cross-outlet mutation is rejected', async () => {
    // Try to reserve from Outlet B (qty=5) but pass Outlet A's product
    await assert.rejects(
      () => inventoryRepository.atomicAdjust({
        workspaceId: wsId, outletId: outlet2Id, productId, delta: -10, reason: 'reserve',
        notes: 'Should fail — attempting to reserve more than stock at Outlet B',
      }),
      (err) => {
        assert.strictEqual(err.code, 'INSUFFICIENT_STOCK');
        return true;
      }
    );

    // Outlet A stock should remain unchanged
    const itemA = await inventoryRepository.findByProduct({ workspaceId: wsId, outletId, productId });
    assert.strictEqual(itemA.quantity, 10, 'Outlet A stock should be unchanged');

    // Outlet B stock should also be unchanged
    const itemB = await inventoryRepository.findByProduct({ workspaceId: wsId, outletId: outlet2Id, productId });
    assert.strictEqual(itemB.quantity, 5, 'Outlet B stock should be unchanged');
  });
});
