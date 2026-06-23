import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSION_MATRIX, hasPermission, normalizeRole } from '../../../src/security/permission-matrix.js';

describe('permission matrix', () => {
  it('normalizes legacy roles', () => {
    assert.equal(normalizeRole('super'), 'admin');
    assert.equal(normalizeRole('agent'), 'human_agent');
  });

  it('exposes critical permissions by role', () => {
    assert.ok(hasPermission('owner', 'payments', 'reconcile'));
    assert.ok(hasPermission('admin', 'settings', 'write'));
    assert.ok(hasPermission('outlet_manager', 'inventory', 'transfer'));
    assert.ok(!hasPermission('human_agent', 'payments', 'reconcile'));
    assert.ok(!hasPermission('human_agent', 'settings', 'write'));
  });

  it('covers all critical section 25 resources', () => {
    const resources = ['products', 'outlets', 'orders', 'payments', 'settings', 'platforms', 'inventory'];
    for (const role of Object.keys(PERMISSION_MATRIX)) {
      for (const resource of resources) {
        assert.ok(Array.isArray(PERMISSION_MATRIX[role].permissions[resource]), `${role}.${resource} is defined`);
      }
    }
  });
});
