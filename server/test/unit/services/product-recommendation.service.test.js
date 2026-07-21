import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  productRecommendationInternals,
  sortAndDedupeRecommendations,
  validateRecommendationInput,
} from '../../../src/services/product-recommendation.service.js';

const sourceId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';
const otherTargetId = '33333333-3333-4333-8333-333333333333';

describe('product recommendation validation', () => {
  it('accepts bounded cart rules and rejects self references, invalid types, and schedules', () => {
    assert.deepEqual(validateRecommendationInput({ sourceProductId: sourceId, targetProductId: targetId, recommendationType: 'upsell', priority: 10 }), {
      sourceProductId: sourceId, targetProductId: targetId, recommendationType: 'upsell', priority: 10,
    });
    assert.throws(() => validateRecommendationInput({ sourceProductId: sourceId, targetProductId: sourceId, recommendationType: 'upsell' }), { code: 'VALIDATION_ERROR' });
    assert.throws(() => validateRecommendationInput({ sourceProductId: sourceId, targetProductId: targetId, recommendationType: 'bundle' }), { code: 'VALIDATION_ERROR' });
    assert.throws(() => validateRecommendationInput({ sourceProductId: sourceId, targetProductId: targetId, recommendationType: 'upsell', startsAt: '2026-07-21', endsAt: '2026-07-20' }), { code: 'VALIDATION_ERROR' });
  });
});

describe('public recommendation filtering', () => {
  it('prefers outlet rules, excludes cart duplicates, deduplicates targets, and applies deterministic ordering', () => {
    const rows = sortAndDedupeRecommendations([
      { id: 'global', targetProductId: targetId, priority: 100, outletSpecificity: 0 },
      { id: 'outlet', targetProductId: targetId, priority: 1, outletSpecificity: 1 },
      { id: 'other', targetProductId: otherTargetId, priority: 10, outletSpecificity: 0 },
      { id: 'cart', targetProductId: sourceId, priority: 1000, outletSpecificity: 1 },
    ], [sourceId]);
    assert.deepEqual(rows.map((row) => row.id), ['outlet', 'other']);
  });

  it('honours schedule and target availability boundaries', () => {
    const now = new Date('2026-07-20T12:00:00.000Z');
    assert.equal(productRecommendationInternals.isInSchedule({ startsAt: '2026-07-20T12:00:00.000Z', endsAt: '2026-07-20T13:00:00.000Z' }, now), true);
    assert.equal(productRecommendationInternals.isInSchedule({ startsAt: '2026-07-20T12:00:00.000Z', endsAt: '2026-07-20T12:00:00.000Z' }, now), false);
    assert.equal(productRecommendationInternals.targetIsAvailable({ isActive: true, stockTracking: true }, { isAvailable: true, status: 'active' }, { quantity: 1 }, now), true);
    assert.equal(productRecommendationInternals.targetIsAvailable({ isActive: true, stockTracking: true }, { isAvailable: true, status: 'active' }, { quantity: 0 }, now), false);
    assert.equal(productRecommendationInternals.targetIsAvailable({ isActive: true }, { isAvailable: false, status: 'active' }, null, now), false);
  });

  it('redacts arbitrary event metadata to the narrow tracking field', () => {
    assert.deepEqual(productRecommendationInternals.safeEventMetadata({ cart_context: 'cart-1', phone: '+628123456789', raw: { secret: true } }), { cart_context: 'cart-1' });
  });
});
