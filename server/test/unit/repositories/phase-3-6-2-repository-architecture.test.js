import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  idempotencyRepository,
  storefrontsRepository,
  outletsRepository,
  catalogRepository,
  checkoutsRepository,
  qrSessionRepository,
  paymentProviderSettingsRepository,
  analyticsRepository,
} from '../../../src/db/repositories/index.js';

describe('Phase 3.6.2 repository architecture exports', () => {
  it('exposes repository methods required by QR repository architecture', () => {
    const expected = [
      [idempotencyRepository, ['findByKey', 'findByKeyForUpdate', 'createProcessingKey', 'markCompleted', 'markFailed', 'storeCompleted', 'withTx']],
      [storefrontsRepository, ['findStorefrontBySlug', 'listStorefrontOutlets', 'isOutletAvailableForStorefront']],
      [outletsRepository, ['findOutletById', 'listActiveOutlets', 'validateOutletOrdering']],
      [catalogRepository, ['listCategories', 'listProductsForOutlet', 'findProductWithModifiers', 'findProductsByIds', 'listAvailabilityForOutlet']],
      [checkoutsRepository, ['createCheckoutSession', 'createCheckoutItems', 'markCheckoutConverted', 'markCheckoutExpired', 'findCheckoutById']],
      [qrSessionRepository, ['createSession', 'findSessionByToken', 'findActiveSessionByToken', 'updateSelectedOutlet', 'markCompleted', 'expireOldSessions']],
      [paymentProviderSettingsRepository, ['findActiveProviderSettings', 'listProviderSettings', 'findProviderByCode', 'updateProviderSettings', 'disableOtherProviders']],
      [analyticsRepository, ['trackQrScan', 'trackCheckoutStarted', 'trackCheckoutCompleted', 'trackPaymentSucceeded', 'trackOrderCompleted', 'getQrPerformanceReport', 'withTx']],
    ];

    for (const [repository, methods] of expected) {
      for (const method of methods) {
        assert.equal(typeof repository[method], 'function', `${method} is implemented`);
      }
    }
  });
});
