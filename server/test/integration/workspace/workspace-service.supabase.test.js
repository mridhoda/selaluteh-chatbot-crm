/**
 * workspace-service.supabase.test.js
 *
 * Integration tests for workspace.service.js (Supabase-backed, task 24.7).
 * These tests require a Supabase test project.
 *
 * Skipped automatically when SUPABASE_TEST_URL / SUPABASE_TEST_SERVICE_ROLE_KEY
 * are not set in the environment.
 *
 * To run:
 *   SUPABASE_TEST_URL=... SUPABASE_TEST_SERVICE_ROLE_KEY=... node --test test/integration/workspace/
 */

import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { isTestDbConfigured, getTestClient, cleanTable, testUuid } from '../../helpers/supabaseTest.js';
import {
  getCurrentWorkspace,
  listUserWorkspaces,
  getWorkspaceDetail,
  updateWorkspace,
} from '../../../src/services/workspace.service.js';

describe('workspace service (Supabase)', (suite) => {
  if (!isTestDbConfigured) {
    it('SKIPPED — set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY to run workspace Supabase tests', (t) => {
      t.skip('Supabase test project not configured');
    });
    return;
  }

  let wsId;
  let userId;
  let client;

  before(async () => {
    client = getTestClient();
  });

  beforeEach(async () => {
    wsId = testUuid();
    userId = testUuid();

    // Insert workspace
    await client.from('workspaces').insert({ id: wsId, name: 'Test Workspace', status: 'active' });

    // Insert user
    await client.from('users').insert({
      id: userId,
      workspace_id: wsId,
      name: 'Test Owner',
      email: `owner-${userId}@test.invalid`,
      password_hash: 'x',
      role: 'owner',
      verified: true,
      status: 'offline',
    });

    // Insert membership
    await client.from('user_workspace_memberships').insert({
      workspace_id: wsId,
      user_id: userId,
      role: 'owner',
      status: 'active',
    });
  });

  afterEach(async () => {
    await client.from('user_workspace_memberships').delete().eq('workspace_id', wsId);
    await client.from('workspace_settings').delete().eq('workspace_id', wsId);
    await client.from('users').delete().eq('id', userId);
    await client.from('workspaces').delete().eq('id', wsId);
  });

  it('getCurrentWorkspace returns workspace by id', async () => {
    const result = await getCurrentWorkspace({ workspaceId: wsId });
    assert.equal(result.name, 'Test Workspace');
    assert.equal(result.id, wsId);
  });

  it('getCurrentWorkspace throws 404 for missing workspace', async () => {
    const fakeId = testUuid();
    await assert.rejects(
      () => getCurrentWorkspace({ workspaceId: fakeId }),
      { code: 'WORKSPACE_NOT_FOUND' },
    );
  });

  it('listUserWorkspaces returns workspaces with membership info', async () => {
    const list = await listUserWorkspaces({ userId });
    assert.ok(list.length >= 1);
    const ws = list.find((w) => w.id === wsId);
    assert.ok(ws, 'Workspace should be in list');
    assert.equal(ws.role, 'owner');
    assert.equal(ws.membershipStatus, 'active');
  });

  it('getWorkspaceDetail requires active membership', async () => {
    const detail = await getWorkspaceDetail({ workspaceId: wsId, userId });
    assert.equal(detail.name, 'Test Workspace');
    assert.equal(detail.role, 'owner');
  });

  it('getWorkspaceDetail throws without membership', async () => {
    const otherId = testUuid();
    await assert.rejects(
      () => getWorkspaceDetail({ workspaceId: wsId, userId: otherId }),
      { code: 'MEMBERSHIP_REQUIRED' },
    );
  });

  it('updateWorkspace updates allowed fields', async () => {
    const updated = await updateWorkspace({
      workspaceId: wsId,
      userId,
      updates: { name: 'Updated Name' },
    });
    assert.equal(updated.name, 'Updated Name');
  });

  it('updateWorkspace throws for non-admin role', async () => {
    const viewerId = testUuid();
    await client.from('user_workspace_memberships').insert({
      workspace_id: wsId,
      user_id: viewerId,
      role: 'viewer',
      status: 'active',
    });
    await assert.rejects(
      () => updateWorkspace({ workspaceId: wsId, userId: viewerId, updates: { name: 'x' } }),
      { code: 'INSUFFICIENT_ROLE' },
    );
  });
});
