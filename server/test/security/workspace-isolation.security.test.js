import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { canManageWorkspace, canAccessAllOutlets, getWorkspaceIdForUser, isWorkspaceWideRole } from '../../src/services/access-control.service.js';
import { attachWorkspaceContext } from '../../src/middleware/workspaceContext.js';
import { membershipsSupabaseRepository } from '../../src/db/repositories/memberships.repository.js';
import { outletsSupabaseRepository } from '../../src/db/repositories/outlets.supabase.repository.js';

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

  it('uses membership role instead of global user role for workspace management', () => {
    assert.equal(canManageWorkspace({ role: 'owner', workspaceRole: 'viewer' }), false);
    assert.equal(canAccessAllOutlets({ role: 'owner', workspaceRole: 'outlet_manager' }), false);
    assert.equal(canManageWorkspace({ role: 'agent', workspaceRole: 'admin' }), true);
  });

  it('attaches an explicitly selected workspace and updates legacy user context', async (t) => {
    t.mock.method(membershipsSupabaseRepository, 'listUserMemberships', async () => [
      { id: 'membership-1', workspaceId: 'workspace-a', userId: 'user-1', role: 'owner', status: 'active' },
      { id: 'membership-2', workspaceId: 'workspace-b', userId: 'user-1', role: 'viewer', status: 'active' },
    ]);
    t.mock.method(outletsSupabaseRepository, 'findUserAccess', async () => []);

    const req = {
      me: { id: 'user-1', role: 'owner', workspaceId: 'legacy-workspace' },
      query: {},
      body: {},
      get: (name) => (name.toLowerCase() === 'x-workspace-id' ? 'workspace-b' : undefined),
    };

    await new Promise((resolve, reject) => {
      attachWorkspaceContext(req, {}, (err) => (err ? reject(err) : resolve()));
    });

    assert.equal(req.workspace.id, 'workspace-b');
    assert.equal(req.workspace.role, 'viewer');
    assert.equal(req.me.workspaceId, 'workspace-b');
    assert.equal(req.me.workspaceRole, 'viewer');
  });

  it('rejects selected workspace without active membership', async (t) => {
    t.mock.method(membershipsSupabaseRepository, 'listUserMemberships', async () => [
      { id: 'membership-1', workspaceId: 'workspace-a', userId: 'user-1', role: 'owner', status: 'active' },
    ]);

    const req = {
      me: { id: 'user-1', role: 'owner', workspaceId: 'workspace-a' },
      query: { workspaceId: 'workspace-b' },
      body: {},
      get: () => undefined,
    };

    const err = await new Promise((resolve) => {
      attachWorkspaceContext(req, {}, (nextErr) => resolve(nextErr));
    });

    assert.equal(err.code, 'MEMBERSHIP_REQUIRED');
    assert.equal(err.status, 403);
  });
});
