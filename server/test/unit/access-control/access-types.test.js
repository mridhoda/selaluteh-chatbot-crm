import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RoleType, hasPermission, ALPHA_PERMISSIONS, isOwnerOrAdmin, canManageOutlet } from '../../../src/access-control/access-types.js';

describe('access-types', () => {
  it('OWNER has all permissions', () => {
    for (const perm of Object.keys(ALPHA_PERMISSIONS)) {
      assert.ok(hasPermission(RoleType.OWNER, perm), `OWNER missing ${perm}`);
    }
  });

  it('OUTLET_STAFF has read-only', () => {
    assert.ok(hasPermission(RoleType.OUTLET_STAFF, 'outlets_read'));
    assert.ok(hasPermission(RoleType.OUTLET_STAFF, 'orders_read'));
    assert.ok(!hasPermission(RoleType.OUTLET_STAFF, 'outlets_write'));
    assert.ok(!hasPermission(RoleType.OUTLET_STAFF, 'members_invite'));
  });

  it('only OWNER can reconcile payments', () => {
    assert.ok(hasPermission(RoleType.OWNER, 'payments_reconcile'));
    assert.ok(!hasPermission(RoleType.ADMIN, 'payments_reconcile'));
  });

  it('isOwnerOrAdmin', () => {
    assert.ok(isOwnerOrAdmin(RoleType.OWNER));
    assert.ok(isOwnerOrAdmin(RoleType.ADMIN));
    assert.ok(!isOwnerOrAdmin(RoleType.OUTLET_MANAGER));
  });

  it('canManageOutlet', () => {
    assert.ok(canManageOutlet(RoleType.OWNER));
    assert.ok(canManageOutlet(RoleType.ADMIN));
    assert.ok(canManageOutlet(RoleType.OUTLET_MANAGER));
    assert.ok(!canManageOutlet(RoleType.OUTLET_STAFF));
  });

  it('unknown permission returns false', () => {
    assert.ok(!hasPermission(RoleType.OWNER, 'nonexistent'));
  });
});
