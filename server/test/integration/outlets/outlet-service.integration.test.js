import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectTestDb, disconnectTestDb, clearTestDb } from '../../helpers/mongoMemory.js';
import { outletsRepository } from '../../../src/db/repositories/index.js';
import { createOutlet, updateOutlet, updateOutletStatus, getOutletDetail } from '../../../src/services/outlet.service.js';
import Outlet from '../../../src/models/Outlet.js';

describe('outlet service', () => {
  before(async () => { await connectTestDb(); });
  after(async () => { await disconnectTestDb(); });
  beforeEach(async () => { await clearTestDb(); });

  const workspaceId = new mongoose.Types.ObjectId();
  const owner = { _id: new mongoose.Types.ObjectId(), workspaceId, role: 'owner' };
  const agent = { _id: new mongoose.Types.ObjectId(), workspaceId, role: 'agent' };

  it('createOutlet creates with unique code', async () => {
    const outlet = await createOutlet({ user: owner, payload: { name: 'New Outlet', code: 'NEW' } });
    assert.strictEqual(outlet.name, 'New Outlet');
    assert.strictEqual(outlet.code, 'NEW');
  });

  it('createOutlet rejects duplicate code', async () => {
    await createOutlet({ user: owner, payload: { name: 'First', code: 'DUP' } });
    await assert.rejects(
      () => createOutlet({ user: owner, payload: { name: 'Second', code: 'dup' } }),
      { code: 'DUPLICATE_CODE' },
    );
  });

  it('createOutlet rejects non-manager', async () => {
    await assert.rejects(
      () => createOutlet({ user: agent, payload: { name: 'Test' } }),
      { code: 'FORBIDDEN' },
    );
  });

  it('getOutletDetail returns outlet', async () => {
    const created = await createOutlet({ user: owner, payload: { name: 'Detail Test' } });
    const detail = await getOutletDetail({ workspaceId, outletId: created._id });
    assert.strictEqual(detail.name, 'Detail Test');
  });

  it('getOutletDetail throws for wrong workspace', async () => {
    const created = await createOutlet({ user: owner, payload: { name: 'Wrong WS' } });
    const other = new mongoose.Types.ObjectId();
    await assert.rejects(
      () => getOutletDetail({ workspaceId: other, outletId: created._id }),
      { code: 'OUTLET_NOT_FOUND' },
    );
  });

  it('updateOutlet updates allowed fields', async () => {
    const created = await createOutlet({ user: owner, payload: { name: 'Before', city: 'Old' } });
    const updated = await updateOutlet({ user: owner, outletId: created._id, updates: { name: 'After', city: 'New' } });
    assert.strictEqual(updated.name, 'After');
    assert.strictEqual(updated.city, 'New');
  });

  it('updateOutletStatus changes status', async () => {
    const created = await createOutlet({ user: owner, payload: { name: 'Status Test' } });
    const updated = await updateOutletStatus({ user: owner, outletId: created._id, status: 'inactive' });
    assert.strictEqual(updated.status, 'inactive');
  });

  it('updateOutletStatus rejects invalid status', async () => {
    const created = await createOutlet({ user: owner, payload: { name: 'Bad Status' } });
    await assert.rejects(
      () => updateOutletStatus({ user: owner, outletId: created._id, status: 'bogus' }),
      { code: 'VALIDATION' },
    );
  });
});
