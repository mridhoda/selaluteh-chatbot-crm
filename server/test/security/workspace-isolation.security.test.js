import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canManageWorkspace, canAccessAllOutlets, getWorkspaceIdForUser, isWorkspaceWideRole } from '../../src/services/access-control.service.js';

describe('workspace isolation security helpers', () => {
  it('treats owner/admin roles as workspace-wide roles', () => {
    assert.equal(isWorkspaceWideRole('owner'), true);
    assert.equal(isWorkspaceWideRole('admin'), true);
    assert.equal(isWorkspaceWideRole('viewer'), false);
    assert.equal(isWorkspaceWideRole('human_agent'), false);
  });

  it('only privileged roles can manage workspace resources', () => {
    assert.equal(canManageWorkspace({ role: 'owner' }), true);
    assert.equal(canManageWorkspace({ role: 'super' }), true);
    assert.equal(canManageWorkspace({ role: 'admin' }), true);
    assert.equal(canManageWorkspace({ role: 'outlet_manager' }), false);
    assert.equal(canManageWorkspace({ role: 'viewer' }), false);
  });

  it('only workspace-wide roles can access all outlets', () => {
    assert.equal(canAccessAllOutlets({ role: 'owner' }), true);
    assert.equal(canAccessAllOutlets({ role: 'super' }), true);
    assert.equal(canAccessAllOutlets({ role: 'admin' }), true);
    assert.equal(canAccessAllOutlets({ role: 'human_agent' }), false);
  });

  it('requires an explicit workspace id on user context', () => {
    assert.equal(getWorkspaceIdForUser({ workspaceId: 'workspace-1' }), 'workspace-1');
    assert.equal(getWorkspaceIdForUser({}), null);
    assert.equal(getWorkspaceIdForUser(null), null);
  });
});
