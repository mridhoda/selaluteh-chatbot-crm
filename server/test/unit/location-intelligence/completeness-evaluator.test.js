import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCompleteness } from '../../../src/services/location-intelligence/completeness-evaluator.js';

describe('CompletenessEvaluator — Task 2.3', () => {
  it('street only → MISSING_CITY', () => {
    assert.equal(evaluateCompleteness({ street: 'Jalan Biawan' }), 'MISSING_CITY');
  });

  it('area only → MISSING_CITY', () => {
    assert.equal(evaluateCompleteness({ area: 'Air Putih' }), 'MISSING_CITY');
  });

  it('landmark only → MISSING_CITY', () => {
    assert.equal(evaluateCompleteness({ landmark: 'Big Mall' }), 'MISSING_CITY');
  });

  it('city only → MISSING_DETAIL', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda' }), 'MISSING_DETAIL');
  });

  it('city + street → READY_TO_RESOLVE', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda', street: 'Jalan Biawan' }), 'READY_TO_RESOLVE');
  });

  it('city + landmark → READY_TO_RESOLVE', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda', landmark: 'Big Mall' }), 'READY_TO_RESOLVE');
  });

  it('city + postal code → READY_TO_RESOLVE', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda', postalCode: '75123' }), 'READY_TO_RESOLVE');
  });

  it('coordinates → READY_TO_CALCULATE', () => {
    assert.equal(evaluateCompleteness({ protectedLatitude: -0.5, protectedLongitude: 117 }), 'READY_TO_CALCULATE');
  });

  it('empty → MISSING_CITY', () => {
    assert.equal(evaluateCompleteness({}), 'MISSING_CITY');
  });

  it('city + area → READY_TO_RESOLVE', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda', area: 'Air Putih' }), 'READY_TO_RESOLVE');
  });

  it('city + placeName → READY_TO_RESOLVE', () => {
    assert.equal(evaluateCompleteness({ city: 'Samarinda', placeName: 'Big Mall' }), 'READY_TO_RESOLVE');
  });
});
