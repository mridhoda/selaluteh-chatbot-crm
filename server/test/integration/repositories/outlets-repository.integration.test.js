import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { outletsRepository } from '../../../src/db/repositories/index.js';
import Outlet from '../../../src/models/Outlet.js';

describe('outlets repository', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await Outlet.create({ workspaceId, name: 'Outlet A', code: 'A', status: 'active' });
    await Outlet.create({ workspaceId, name: 'Outlet B', code: 'B', status: 'active' });
    await Outlet.create({ workspaceId, name: 'Outlet C', code: 'C', status: 'inactive' });
  });

  it('list returns paginated outlets', async () => {
    const result = await outletsRepository.list({ workspaceId, limit: '2', page: '1' });
    assert.ok(Array.isArray(result));
    assert.strictEqual(result.length, 2);
  });

  it('list filters by status', async () => {
    const result = await outletsRepository.list({ workspaceId, status: 'inactive' });
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].code, 'C');
  });

  it('list searches by name', async () => {
    const result = await outletsRepository.list({ workspaceId, search: 'Outlet B' });
    assert.strictEqual(result.length, 1);
  });

  it('count returns total matching filters', async () => {
    const total = await outletsRepository.count({ workspaceId });
    assert.strictEqual(total, 3);
  });

  it('findByCode finds outlet by code', async () => {
    const outlet = await outletsRepository.findByCode({ workspaceId, code: 'a' });
    assert.ok(outlet);
    assert.strictEqual(outlet.name, 'Outlet A');
  });

  it('update modifies outlet fields', async () => {
    const outlet = await Outlet.findOne({ workspaceId, code: 'A' });
    const updated = await outletsRepository.update({ workspaceId, outletId: outlet._id, updates: { name: 'Updated A' } });
    assert.strictEqual(updated.name, 'Updated A');
  });

  it('updateStatus changes status', async () => {
    const outlet = await Outlet.findOne({ workspaceId, code: 'A' });
    const updated = await outletsRepository.updateStatus({ workspaceId, outletId: outlet._id, status: 'inactive' });
    assert.strictEqual(updated.status, 'inactive');
  });

  it('findById returns null for wrong workspace', async () => {
    const outlet = await Outlet.findOne({ workspaceId, code: 'A' });
    const other = new mongoose.Types.ObjectId();
    const result = await outletsRepository.findById({ outletId: outlet._id, workspaceId: other });
    assert.strictEqual(result, null);
  });
});
