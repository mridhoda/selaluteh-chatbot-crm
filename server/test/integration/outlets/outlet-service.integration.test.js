import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createOutlet, updateOutlet, updateOutletStatus, getOutletDetail, listActiveWorkspaceOutlets } from '../../../src/services/outlet.service.js';


describe('outlet service contract', () => {
  it('exports Supabase-backed outlet service functions', () => {
    assert.equal(typeof createOutlet, 'function');
    assert.equal(typeof updateOutlet, 'function');
    assert.equal(typeof updateOutletStatus, 'function');
    assert.equal(typeof getOutletDetail, 'function');
    assert.equal(typeof listActiveWorkspaceOutlets, 'function');
  });

  it('rejects invalid status before repository mutation', async () => {
    await assert.rejects(
      () => updateOutletStatus({ user: { role: 'owner', workspaceId: 'workspace-1' }, outletId: 'outlet-1', status: 'bad' }),
      (err) => err.code === 'VALIDATION' && err.status === 400,
    );
  });
});
