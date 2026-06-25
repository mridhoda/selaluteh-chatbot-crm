import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createOutlet, updateOutlet, updateOutletStatus, getOutletDetail, listActiveWorkspaceOutlets, deleteOutlet, setUserOutletAccess } from '../../../src/services/outlet.service.js';
import { outletsSupabaseRepository, outletManagementRepository } from '../../../src/db/repositories/index.js';
import { membershipsSupabaseRepository } from '../../../src/db/repositories/memberships.repository.js';


describe('outlet service contract', () => {
  it('exports Supabase-backed outlet service functions', () => {
    assert.equal(typeof createOutlet, 'function');
    assert.equal(typeof updateOutlet, 'function');
    assert.equal(typeof updateOutletStatus, 'function');
    assert.equal(typeof getOutletDetail, 'function');
    assert.equal(typeof listActiveWorkspaceOutlets, 'function');
    assert.equal(typeof deleteOutlet, 'function');
    assert.equal(typeof setUserOutletAccess, 'function');
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

  describe('deleteOutlet logic', () => {
    it('successfully deletes an outlet with valid permissions and existing ID', async () => {
      const user = { role: 'owner', workspaceId: 'test-workspace-id' };
      const outletId = 'test-outlet-uuid';

      // Mock repository calls
      const findByIdMock = mock.method(outletsSupabaseRepository, 'findById', async () => ({
        id: outletId,
        name: 'Test Outlet',
      }));
      const deleteMock = mock.method(outletsSupabaseRepository, 'delete', async () => true);

      const result = await deleteOutlet({ user, outletId });

      assert.deepEqual(result, { id: outletId });
      assert.equal(findByIdMock.mock.callCount(), 1);
      assert.equal(deleteMock.mock.callCount(), 1);

      mock.restoreAll();
    });

    it('rejects deletion if user does not have manage workspace permissions', async () => {
      const user = { role: 'staff', workspaceId: 'test-workspace-id' };
      const outletId = 'test-outlet-uuid';

      await assert.rejects(
        () => deleteOutlet({ user, outletId }),
        (err) => err.code === 'FORBIDDEN' && err.status === 403
      );
    });

    it('rejects deletion if outlet does not exist', async () => {
      const user = { role: 'owner', workspaceId: 'test-workspace-id' };
      const outletId = 'nonexistent-uuid';

      const findByIdMock = mock.method(outletsSupabaseRepository, 'findById', async () => null);

      await assert.rejects(
        () => deleteOutlet({ user, outletId }),
        (err) => err.code === 'OUTLET_NOT_FOUND' && err.status === 404
      );

      assert.equal(findByIdMock.mock.callCount(), 1);
      mock.restoreAll();
    });
  });

  describe('setUserOutletAccess logic', () => {
    it('rejects target users without active workspace membership', async () => {
      const membershipMock = mock.method(membershipsSupabaseRepository, 'findActiveMembership', async () => null);

      await assert.rejects(
        () => setUserOutletAccess({
          user: { id: 'owner-1', role: 'owner', workspaceRole: 'owner', workspaceId: 'workspace-1' },
          targetUserId: 'user-2',
          outlets: [{ outletId: 'outlet-1' }],
        }),
        (err) => err.code === 'MEMBERSHIP_REQUIRED' && err.status === 403,
      );

      assert.equal(membershipMock.mock.callCount(), 1);
      mock.restoreAll();
    });

    it('rejects outlet access rows for outlets outside the active workspace', async () => {
      const membershipMock = mock.method(membershipsSupabaseRepository, 'findActiveMembership', async () => ({
        id: 'membership-1',
        workspaceId: 'workspace-1',
        userId: 'user-2',
        role: 'outlet_manager',
        status: 'active',
      }));
      const findByIdMock = mock.method(outletsSupabaseRepository, 'findById', async () => null);
      const replaceMock = mock.method(outletsSupabaseRepository, 'replaceUserAccess', async () => []);

      await assert.rejects(
        () => setUserOutletAccess({
          user: { id: 'owner-1', role: 'owner', workspaceRole: 'owner', workspaceId: 'workspace-1' },
          targetUserId: 'user-2',
          outlets: [{ outletId: 'outlet-from-other-workspace' }],
        }),
        (err) => err.code === 'OUTLET_NOT_FOUND' && err.status === 404,
      );

      assert.equal(membershipMock.mock.callCount(), 1);
      assert.equal(findByIdMock.mock.callCount(), 1);
      assert.equal(replaceMock.mock.callCount(), 0);
      mock.restoreAll();
    });
  });
});
