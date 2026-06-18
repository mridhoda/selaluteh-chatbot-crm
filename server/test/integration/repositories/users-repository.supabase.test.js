/**
 * users-repository.supabase.test.js
 *
 * Integration tests for usersSupabaseRepository against a real Supabase database.
 *
 * REQUIREMENTS: These tests require SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY
 * to be set in server/.env pointing to a Supabase LOCAL instance or dedicated TEST project.
 * Tests will skip gracefully if not configured.
 * NEVER run against production Supabase.
 *
 * SETUP:
 *   1. supabase start  (or point to a dedicated test project)
 *   2. Apply SQL migrations (001–009) to the test DB
 *   3. Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY in server/.env
 *   4. npm test test/integration/repositories/users-repository.supabase.test.js
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { skipIfNoTestDb, cleanTable, cleanRows, testUuid } from '../../helpers/supabaseTest.js';

// Check test DB availability before loading repository
const { skip, client, reason } = skipIfNoTestDb();

if (skip) {
  // Print skip notice and exit cleanly — do not fail CI
  console.log(`[SKIP] users-repository.supabase.test.js: ${reason}`);
  process.exit(0);
}

// Dynamically import repository only when test DB is available
// This prevents the repository from trying to connect to production Supabase
const { usersSupabaseRepository } = await import('../../../src/db/repositories/users.repository.js');

const TEST_WORKSPACE_ID = testUuid();
const OTHER_WORKSPACE_ID = testUuid();

// Track created row IDs for cleanup
let createdWorkspaceIds = [];
let createdUserIds = [];

describe('usersSupabaseRepository', () => {
  before(async () => {
    // Seed a test workspace so FK constraint is satisfied
    const { data, error } = await client
      .from('workspaces')
      .insert([
        { id: TEST_WORKSPACE_ID, name: 'Test Workspace' },
        { id: OTHER_WORKSPACE_ID, name: 'Other Workspace' },
      ])
      .select();
    if (error) throw new Error(`Seed workspace failed: ${error.message}`);
    createdWorkspaceIds = data.map((r) => r.id);
  });

  after(async () => {
    // Clean up in reverse FK order
    await cleanTable(client, 'users', TEST_WORKSPACE_ID);
    await cleanTable(client, 'users', OTHER_WORKSPACE_ID);
    await cleanRows(client, 'workspaces', createdWorkspaceIds);
  });

  beforeEach(async () => {
    await cleanTable(client, 'users', TEST_WORKSPACE_ID);
    await cleanTable(client, 'users', OTHER_WORKSPACE_ID);
    createdUserIds = [];
  });

  // --- createUser ---

  it('createUser returns a camelCase UserRecord', async () => {
    const user = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Alice',
      email: 'alice@test.local',
      passwordHash: 'hashed_value',
      role: 'owner',
    });

    assert.ok(user.id, 'id is present');
    assert.equal(user.workspaceId, TEST_WORKSPACE_ID);
    assert.equal(user.name, 'Alice');
    assert.equal(user.email, 'alice@test.local');
    assert.equal(user.passwordHash, 'hashed_value');
    assert.equal(user.role, 'owner');
    assert.equal(user.verified, false);
    // DB row fields must be camelCase in the result
    assert.ok(!('workspace_id' in user), 'no snake_case keys in result');
    assert.ok(!('password_hash' in user), 'no snake_case keys in result');

    createdUserIds.push(user.id);
  });

  it('createUser normalizes email to lowercase', async () => {
    const user = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Bob',
      email: 'BOB@TEST.LOCAL',
      passwordHash: 'hash',
    });
    assert.equal(user.email, 'bob@test.local');
    createdUserIds.push(user.id);
  });

  it('createUser throws DUPLICATE on duplicate email', async () => {
    await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Carol',
      email: 'carol@test.local',
      passwordHash: 'hash',
    });
    await assert.rejects(
      () =>
        usersSupabaseRepository.createUser({
          workspaceId: TEST_WORKSPACE_ID,
          name: 'Carol 2',
          email: 'carol@test.local',
          passwordHash: 'hash',
        }),
      (err) => {
        assert.equal(err.code, 'DUPLICATE');
        assert.equal(err.status, 409);
        return true;
      },
    );
  });

  // --- findByEmail ---

  it('findByEmail returns user with correct data', async () => {
    await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Dave',
      email: 'dave@test.local',
      passwordHash: 'hash_dave',
    });
    const found = await usersSupabaseRepository.findByEmail('dave@test.local');
    assert.ok(found);
    assert.equal(found.name, 'Dave');
    assert.equal(found.passwordHash, 'hash_dave');
  });

  it('findByEmail is case-insensitive', async () => {
    await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Eve',
      email: 'eve@test.local',
      passwordHash: 'hash',
    });
    const found = await usersSupabaseRepository.findByEmail('EVE@TEST.LOCAL');
    assert.ok(found);
    assert.equal(found.name, 'Eve');
  });

  it('findByEmail returns null for unknown email', async () => {
    const result = await usersSupabaseRepository.findByEmail('nobody@test.local');
    assert.strictEqual(result, null);
  });

  // --- findById ---

  it('findById returns user by UUID', async () => {
    const created = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Frank',
      email: 'frank@test.local',
      passwordHash: 'hash',
    });
    const found = await usersSupabaseRepository.findById(created.id);
    assert.ok(found);
    assert.equal(found.id, created.id);
    assert.equal(found.name, 'Frank');
    createdUserIds.push(created.id);
  });

  it('findById returns null for unknown UUID', async () => {
    const result = await usersSupabaseRepository.findById(testUuid());
    assert.strictEqual(result, null);
  });

  // --- getById ---

  it('getById throws NOT_FOUND for unknown UUID', async () => {
    await assert.rejects(
      () => usersSupabaseRepository.getById(testUuid()),
      (err) => {
        assert.equal(err.code, 'NOT_FOUND');
        assert.equal(err.status, 404);
        return true;
      },
    );
  });

  // --- findByWorkspace — workspace isolation ---

  it('findByWorkspace only returns users in the given workspace', async () => {
    // Create user in test workspace
    await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Grace',
      email: 'grace@test.local',
      passwordHash: 'hash',
    });
    // Create user in OTHER workspace
    await usersSupabaseRepository.createUser({
      workspaceId: OTHER_WORKSPACE_ID,
      name: 'Mallory',
      email: 'mallory@test.local',
      passwordHash: 'hash',
    });

    const result = await usersSupabaseRepository.findByWorkspace(TEST_WORKSPACE_ID);
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'Grace');
    // Mallory from other workspace must not appear
    assert.ok(!result.some((u) => u.name === 'Mallory'), 'cross-workspace user not returned');
  });

  it('findByWorkspace throws MISSING_WORKSPACE_SCOPE if workspaceId is absent', async () => {
    await assert.rejects(
      () => usersSupabaseRepository.findByWorkspace(null),
      (err) => {
        assert.equal(err.code, 'MISSING_WORKSPACE_SCOPE');
        return true;
      },
    );
  });

  // --- setVerified ---

  it('setVerified marks user as verified', async () => {
    const user = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Heidi',
      email: 'heidi@test.local',
      passwordHash: 'hash',
    });
    assert.equal(user.verified, false);
    await usersSupabaseRepository.setVerified(user.id);
    const updated = await usersSupabaseRepository.findById(user.id);
    assert.equal(updated.verified, true);
    createdUserIds.push(user.id);
  });

  // --- setStatus ---

  it('setStatus updates user status', async () => {
    const user = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Ivan',
      email: 'ivan@test.local',
      passwordHash: 'hash',
    });
    await usersSupabaseRepository.setStatus(user.id, 'online');
    const updated = await usersSupabaseRepository.findById(user.id);
    assert.equal(updated.status, 'online');
    createdUserIds.push(user.id);
  });

  // --- camelCase mapping ---

  it('returned record has no snake_case keys', async () => {
    const user = await usersSupabaseRepository.createUser({
      workspaceId: TEST_WORKSPACE_ID,
      name: 'Judy',
      email: 'judy@test.local',
      passwordHash: 'hash',
    });
    const snakeKeys = Object.keys(user).filter((k) => k.includes('_'));
    assert.deepEqual(snakeKeys, [], `snake_case keys found: ${snakeKeys.join(', ')}`);
    createdUserIds.push(user.id);
  });
});
