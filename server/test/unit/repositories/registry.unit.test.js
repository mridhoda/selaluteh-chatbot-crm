import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as repositories from '../../../src/db/repositories/index.js';

const expectedExports = [
  'usersRepository',
  'usersSupabaseRepository',
  'workspacesRepository',
  'workspacesSupabaseRepository',
  'membershipsRepository',
  'membershipsSupabaseRepository',
  'workspaceMembershipsRepository',
  'authSupabaseRepository',
  'outletsRepository',
  'outletsSupabaseRepository',
  'platformsRepository',
  'platformsSupabaseRepository',
  'contactsRepository',
  'contactsSupabaseRepository',
  'chatsRepository',
  'chatsSupabaseRepository',
  'messagesRepository',
  'messagesSupabaseRepository',
  'productsRepository',
  'productsSupabaseRepository',
  'cartsRepository',
  'cartsSupabaseRepository',
  'checkoutsRepository',
  'checkoutsSupabaseRepository',
  'idempotencyRepository',
  'ordersRepository',
  'ordersSupabaseRepository',
  'qrSessionRepository',
  'storefrontRepository',
  'paymentsRepository',
  'paymentsSupabaseRepository',
  'paymentEventsRepository',
  'paymentProviderSettingsRepository',
  'webhookEventsRepository',
  'webhookEventsSupabaseRepository',
  'catalogRepository',
  'outletRepository',
  'adminUserRepository',
  'auditLogRepository',
  'auditLogsRepository',
  'analyticsRepository',
  'aiActionsRepository',
  'aiActionsSupabaseRepository',
  'agentsRepository',
  'agentsSupabaseRepository',
  'complaintsRepository',
  'complaintsSupabaseRepository',
];

describe('repository registry', () => {
  for (const exportName of expectedExports) {
    it(`exports ${exportName}`, () => {
      assert.equal(typeof repositories[exportName], 'object');
    });
  }

  it('legacy aliases point to Supabase implementations', () => {
    assert.equal(repositories.cartsRepository, repositories.cartsSupabaseRepository);
    assert.equal(repositories.productsRepository, repositories.productsSupabaseRepository);
    assert.equal(repositories.ordersRepository, repositories.ordersSupabaseRepository);
    assert.equal(repositories.paymentsRepository, repositories.paymentsSupabaseRepository);
    assert.equal(repositories.webhookEventsRepository, repositories.webhookEventsSupabaseRepository);
    assert.equal(repositories.catalogRepository, repositories.productsSupabaseRepository);
    assert.equal(repositories.outletRepository, repositories.outletsSupabaseRepository);
    assert.equal(repositories.qrSessionRepository, repositories.qrOrderSessionsRepository);
    assert.equal(repositories.storefrontRepository, repositories.storefrontsRepository);
  });
});
