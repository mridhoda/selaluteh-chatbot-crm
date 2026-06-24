import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createOutlet, updateOutlet, updateOutletStatus, getOutletDetail, listActiveWorkspaceOutlets } from '../../../src/services/outlet.service.js';
import { outletsSupabaseRepository, outletManagementRepository } from '../../../src/db/repositories/index.js';


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

  describe('createOutlet logic', () => {
    it('successfully creates an outlet with valid payload', async () => {
      const user = { role: 'owner', workspaceId: 'test-workspace-id' };
      const payload = {
        name: 'Test Outlet',
        code: 'TST-OUTLET-01',
        city: 'Samarinda',
        region: 'Kalimantan Timur',
        address: 'Jl. Test 123',
        status: 'active'
      };

      // Mock repository calls
      const findByCodeMock = mock.method(outletsSupabaseRepository, 'findByCode', async () => null);
      const createMock = mock.method(outletsSupabaseRepository, 'create', async (data) => ({
        id: 'test-outlet-uuid',
        ...data
      }));
      const upsertSettingsMock = mock.method(outletManagementRepository, 'upsertServiceSettings', async () => {});

      const result = await createOutlet({ user, payload });

      assert.equal(result.id, 'test-outlet-uuid');
      assert.equal(result.name, 'Test Outlet');
      assert.equal(result.code, 'TST-OUTLET-01');
      assert.equal(result.operational_status, 'ACTIVE');

      // Verify mock calls
      assert.equal(findByCodeMock.mock.callCount(), 1);
      assert.equal(createMock.mock.callCount(), 1);
      assert.equal(upsertSettingsMock.mock.callCount(), 1);

      // Restore mocks
      mock.restoreAll();
    });

    it('rejects creation if user does not have manage workspace permissions', async () => {
      const user = { role: 'staff', workspaceId: 'test-workspace-id' };
      const payload = { name: 'Test Outlet' };

      await assert.rejects(
        () => createOutlet({ user, payload }),
        (err) => err.code === 'FORBIDDEN' && err.status === 403
      );
    });

    it('rejects creation if outlet code is a duplicate in the workspace', async () => {
      const user = { role: 'owner', workspaceId: 'test-workspace-id' };
      const payload = { name: 'Test Outlet', code: 'DUP-01' };

      // Mock findByCode to return an existing record
      const findByCodeMock = mock.method(outletsSupabaseRepository, 'findByCode', async () => ({ id: 'existing-id' }));

      await assert.rejects(
        () => createOutlet({ user, payload }),
        (err) => err.code === 'DUPLICATE_CODE' && err.status === 409
      );

      assert.equal(findByCodeMock.mock.callCount(), 1);
      mock.restoreAll();
    });
  });
});
