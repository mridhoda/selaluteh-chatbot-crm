import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import Chat from '../../src/models/Chat.js';
import Contact from '../../src/models/Contact.js';
import Order from '../../src/models/Order.js';
import Outlet from '../../src/models/Outlet.js';
import UserOutletAccess from '../../src/models/UserOutletAccess.js';
import { assertOutletAccess, buildOutletScopedQuery, assertActiveMembership, assertRolePermission } from '../../src/services/access-control.service.js';
import { listOrdersForUser } from '../../src/services/order.service.js';
import { workspaceMembershipsRepository } from '../../src/db/repositories/index.js';
import { clearTestDb, connectTestDb, disconnectTestDb, objectId } from '../helpers/mongoMemory.js';

describe('workspace and outlet isolation', () => {
  before(connectTestDb);
  afterEach(clearTestDb);
  after(disconnectTestDb);

  it('owner scoped order list only returns own workspace orders', async () => {
    const workspaceA = objectId();
    const workspaceB = objectId();
    const ownerA = { _id: objectId(), workspaceId: workspaceA, role: 'owner' };

    const orderA = await createOrderFixture({ workspaceId: workspaceA });
    await createOrderFixture({ workspaceId: workspaceB });

    const rows = await listOrdersForUser({ user: ownerA });

    assert.deepEqual(rows.map((row) => String(row._id)), [String(orderA._id)]);
  });

  it('outlet manager scoped query only includes assigned outlets', async () => {
    const workspaceId = objectId();
    const manager = { _id: objectId(), workspaceId, role: 'agent' };
    const outletA = await Outlet.create({ workspaceId, name: 'Outlet A', code: 'A' });
    const outletB = await Outlet.create({ workspaceId, name: 'Outlet B', code: 'B' });

    await UserOutletAccess.create({
      workspaceId,
      userId: manager._id,
      outletId: outletA._id,
      role: 'outlet_manager',
      status: 'active',
    });

    const query = await buildOutletScopedQuery(manager);

    assert.equal(String(query.workspaceId), String(workspaceId));
    assert.deepEqual(query.outletId.$in.map(String), [String(outletA._id)]);
    assert.ok(!query.outletId.$in.map(String).includes(String(outletB._id)));
  });

  it('rejects outlet access to another workspace', async () => {
    const workspaceA = objectId();
    const workspaceB = objectId();
    const userA = { _id: objectId(), workspaceId: workspaceA, role: 'owner' };
    const outletB = await Outlet.create({ workspaceId: workspaceB, name: 'Other Workspace Outlet', code: 'B' });

    await assert.rejects(
      () => assertOutletAccess(userA, outletB._id),
      (err) => err.status === 404 && /Outlet not found/.test(err.message),
    );
  });

  it('rejects unassigned outlet access for non all-outlet role', async () => {
    const workspaceId = objectId();
    const user = { _id: objectId(), workspaceId, role: 'agent' };
    const outlet = await Outlet.create({ workspaceId, name: 'Outlet A', code: 'A' });

    await assert.rejects(
      () => assertOutletAccess(user, outlet._id),
      (err) => err.status === 403 && /Forbidden outlet access/.test(err.message),
    );
  });

  it('legacy orders without workspaceId are visible only through own workspace chat fallback', async () => {
    const workspaceA = objectId();
    const workspaceB = objectId();
    const ownerA = { _id: objectId(), workspaceId: workspaceA, role: 'owner' };
    const legacyOrderA = await createLegacyOrderFixture({ workspaceId: workspaceA });
    await createLegacyOrderFixture({ workspaceId: workspaceB });

    const rows = await listOrdersForUser({ user: ownerA });

    assert.deepEqual(rows.map((row) => String(row._id)), [String(legacyOrderA._id)]);
  });

  it('inactive membership is denied from assertActiveMembership', async () => {
    const workspaceId = objectId();
    const userId = objectId();
    const membership = await workspaceMembershipsRepository.createMembership({ workspaceId, userId, role: 'human_agent' });
    await workspaceMembershipsRepository.disableMembership({ userId, workspaceId });

    await assert.rejects(
      () => assertActiveMembership({ userId, workspaceId }),
      (err) => err.code === 'MEMBERSHIP_REQUIRED',
    );
  });

  it('countWorkspaceOwners returns 1 for single owner workspace', async () => {
    const workspaceId = objectId();
    const ownerId = objectId();
    await workspaceMembershipsRepository.createMembership({ workspaceId, userId: ownerId, role: 'owner' });

    const count = await workspaceMembershipsRepository.countWorkspaceOwners(workspaceId);
    assert.equal(count, 1);

    // Route-level FINAL_OWNER protection uses countWorkspaceOwners before
    // calling disableMembership. Verifying the count matches the guard condition.
    assert.ok(count <= 1, 'Cannot disable last owner');
  });
});

async function createOrderFixture({ workspaceId, outletId = null }) {
  const { chat, contact, agentId } = await createChatFixture({ workspaceId });
  return Order.create({
    workspaceId,
    outletId,
    chatId: chat._id,
    contactId: contact._id,
    agentId,
    formName: 'Test Order',
    formData: {},
    status: 'new',
  });
}

async function createLegacyOrderFixture({ workspaceId }) {
  const { chat, contact, agentId } = await createChatFixture({ workspaceId });
  return Order.collection.insertOne({
    chatId: chat._id,
    contactId: contact._id,
    agentId,
    formName: 'Legacy Test Order',
    formData: {},
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
  }).then((result) => Order.findById(result.insertedId));
}

async function createChatFixture({ workspaceId }) {
  const userId = objectId();
  const agentId = objectId();
  const platformId = objectId();
  const contact = await Contact.create({
    userId,
    workspaceId,
    name: 'Customer',
    platformType: 'telegram',
    platformAccountId: String(objectId()),
  });
  const chat = await Chat.create({
    userId,
    workspaceId,
    agentId,
    contactId: contact._id,
    platformId,
    platformType: 'telegram',
  });

  return { chat, contact, agentId };
}
