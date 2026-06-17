import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import UserWorkspaceMembership from '../../../src/models/UserWorkspaceMembership.js';
import { workspaceMembershipsRepository } from '../../../src/db/repositories/index.js';

describe('UserWorkspaceMembership model and repository', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  it('creates a membership record', async () => {
    const membership = await workspaceMembershipsRepository.createMembership({
      workspaceId, userId, role: 'owner',
    });
    assert.ok(membership._id);
    assert.strictEqual(membership.role, 'owner');
    assert.strictEqual(membership.status, 'active');
  });

  it('finds active membership', async () => {
    const found = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
    assert.ok(found);
    assert.strictEqual(found.role, 'owner');
  });

  it('listUserMemberships returns memberships for user', async () => {
    const list = await workspaceMembershipsRepository.listUserMemberships({ userId });
    assert.ok(Array.isArray(list));
    assert.strictEqual(list.length, 1);
  });

  it('listWorkspaceMembers returns members for workspace', async () => {
    const members = await workspaceMembershipsRepository.listWorkspaceMembers({ workspaceId });
    assert.ok(members.length >= 1);
  });

  it('updates role', async () => {
    const updated = await workspaceMembershipsRepository.updateRole({ userId, workspaceId, role: 'admin' });
    assert.strictEqual(updated.role, 'admin');
  });

  it('disables membership', async () => {
    const disabled = await workspaceMembershipsRepository.disableMembership({ userId, workspaceId });
    assert.strictEqual(disabled.status, 'disabled');
    const found = await workspaceMembershipsRepository.findActiveMembership({ userId, workspaceId });
    assert.strictEqual(found, null);
  });

  it('has unique index on userId + workspaceId at schema level', () => {
    const indexes = UserWorkspaceMembership.schema.indexes();
    const hasUnique = indexes.some(([fields, opts]) =>
      fields.userId === 1 && fields.workspaceId === 1 && opts.unique === true,
    );
    assert.strictEqual(hasUnique, true);
  });
});
