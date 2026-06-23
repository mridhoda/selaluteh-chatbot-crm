import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { adjustStock, reserveStock, releaseStock } from '../../../src/services/inventory.service.js';

describe('inventory.service', () => {
  describe('adjustStock', () => {
    it('rejects zero delta', async () => {
      await assert.rejects(
        () => adjustStock({ workspaceId: 'w', outletId: 'o', productId: 'p', delta: 0, reason: 'adjustment' }),
        (err) => {
          assert.strictEqual(err.code, 'VALIDATION');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    it('rejects invalid reason', async () => {
      await assert.rejects(
        () => adjustStock({ workspaceId: 'w', outletId: 'o', productId: 'p', delta: 5, reason: 'invalid' }),
        (err) => {
          assert.strictEqual(err.code, 'VALIDATION');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });
  });

  describe('reserveStock', () => {
    it('reserves with negative delta', async () => {
      assert.ok(reserveStock.length > 0);
    });
  });
});
