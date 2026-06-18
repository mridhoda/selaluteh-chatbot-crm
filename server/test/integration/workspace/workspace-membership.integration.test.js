import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { membershipsRepository } from '../../../src/db/repositories/index.js';
import { isWorkspaceWideRole } from '../../../src/services/access-control.service.js';


describe('workspace membership contract', () => {
  it('exposes Supabase membership repository methods used by services', () => {
    for (const method of ['findActiveMembership', 'listUserMemberships', 'listWorkspaceMembers', 'createMembership', 'updateRole', 'disableMembership', 'countWorkspaceOwners']) {
      assert.equal(typeof membershipsRepository[method], 'function', `${method} exists`);
    }
  });

  it('classifies workspace-wide roles consistently', () => {
    assert.equal(isWorkspaceWideRole('owner'), true);
    assert.equal(isWorkspaceWideRole('admin'), true);
    assert.equal(isWorkspaceWideRole('human_agent'), false);
    assert.equal(isWorkspaceWideRole('viewer'), false);
  });
});
