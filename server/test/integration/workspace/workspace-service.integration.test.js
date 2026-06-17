import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { workspaceMembershipsRepository } from '../../../src/db/repositories/index.js';
import { getCurrentWorkspace, listUserWorkspaces, getWorkspaceDetail, updateWorkspace } from '../../../src/services/workspace.service.js';
import Workspace from '../../../src/models/Workspace.js';

describe('workspace service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  let workspace;
  const userId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    workspace = await Workspace.create({ name: 'Test Workspace', status: 'active' });
    await workspaceMembershipsRepository.createMembership({
      workspaceId: workspace._id, userId, role: 'owner',
    });
  });

  it('getCurrentWorkspace returns workspace by id', async () => {
    const result = await getCurrentWorkspace({ workspaceId: workspace._id });
    assert.strictEqual(result.name, 'Test Workspace');
  });

  it('getCurrentWorkspace throws 404 for missing workspace', async () => {
    const fake = new mongoose.Types.ObjectId();
    await assert.rejects(() => getCurrentWorkspace({ workspaceId: fake }), { code: 'WORKSPACE_NOT_FOUND' });
  });

  it('listUserWorkspaces returns workspaces with membership info', async () => {
    const list = await listUserWorkspaces({ userId });
    assert.ok(list.length >= 1);
    assert.ok(list[0].role);
    assert.ok(list[0].membershipStatus);
  });

  it('getWorkspaceDetail requires active membership', async () => {
    const detail = await getWorkspaceDetail({ workspaceId: workspace._id, userId });
    assert.strictEqual(detail.name, 'Test Workspace');
    assert.strictEqual(detail.role, 'owner');
  });

  it('getWorkspaceDetail throws without membership', async () => {
    const otherUser = new mongoose.Types.ObjectId();
    await assert.rejects(
      () => getWorkspaceDetail({ workspaceId: workspace._id, userId: otherUser }),
      { code: 'MEMBERSHIP_REQUIRED' },
    );
  });

  it('updateWorkspace updates allowed fields', async () => {
    const updated = await updateWorkspace({ workspaceId: workspace._id, userId, updates: { name: 'Updated' } });
    assert.strictEqual(updated.name, 'Updated');
  });

  it('updateWorkspace throws for non-admin', async () => {
    const viewerId = new mongoose.Types.ObjectId();
    await workspaceMembershipsRepository.createMembership({
      workspaceId: workspace._id, userId: viewerId, role: 'viewer',
    });
    await assert.rejects(
      () => updateWorkspace({ workspaceId: workspace._id, userId: viewerId, updates: { name: 'x' } }),
      { code: 'INSUFFICIENT_ROLE' },
    );
  });
});
