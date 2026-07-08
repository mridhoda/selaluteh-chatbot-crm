import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertWorkspaceScope,
  buildOrderListFilter,
  normalizeRepositoryError,
  withRepositoryTx,
} from '../../../src/db/repositories/repository-contract.js';

describe('repository architecture contract helpers', () => {
  it('requires workspace scope for tenant-owned repository filters', () => {
    assert.doesNotThrow(() => assertWorkspaceScope('workspace-1'));
    assert.throws(
      () => assertWorkspaceScope(null),
      (err) => err.code === 'MISSING_WORKSPACE_SCOPE',
    );
  });

  it('builds workspace-scoped order list filter', () => {
    const filter = buildOrderListFilter({ workspaceId: 'workspace-1', outletIds: ['outlet-1'], page: 2, limit: 25 });

    assert.equal(filter.workspaceId, 'workspace-1');
    assert.deepEqual(filter.outletIds, ['outlet-1']);
    assert.equal(filter.page, 2);
    assert.equal(filter.limit, 25);
  });

  it('adds withTx wrapper without mutating repository object', () => {
    const repository = { async findById() { return null; } };
    const txAware = withRepositoryTx(repository);
    const tx = { query() {} };
    const scoped = txAware.withTx(tx);

    assert.equal(typeof txAware.findById, 'function');
    assert.equal(scoped.tx, tx);
    assert.equal(typeof scoped.findById, 'function');
    assert.equal(repository.tx, undefined);
  });

  it('normalizes common postgres repository errors', () => {
    const duplicate = normalizeRepositoryError({ code: '23505', message: 'duplicate key' }, 'idempotency.create');
    const deadlock = normalizeRepositoryError({ code: '40P01', message: 'deadlock' }, 'orders.update');

    assert.equal(duplicate.code, 'UNIQUE_CONSTRAINT_VIOLATION');
    assert.equal(duplicate.status, 409);
    assert.equal(deadlock.code, 'DEADLOCK_DETECTED');
    assert.equal(deadlock.status, 409);
  });
});
