import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineDistance, EARTH_RADIUS_METERS } from '../../../src/services/location-intelligence/haversine.js';

describe('Haversine — Task 12.1', () => {
  it('same coordinate = 0', () => {
    const d = haversineDistance(-0.502106, 117.153709, -0.502106, 117.153709);
    assert.equal(d, 0);
  });

  it('known coordinate fixtures', () => {
    const d = haversineDistance(-0.502106, 117.153709, -0.493793, 117.147362);
    assert(d > 0);
    assert(d < 5000);
  });

  it('non-negative', () => {
    const d = haversineDistance(-6.2, 106.8, -0.5, 117.15);
    assert.ok(d >= 0);
  });

  it('symmetry (A→B === B→A)', () => {
    const d1 = haversineDistance(-6.2, 106.8, -0.5, 117.15);
    const d2 = haversineDistance(-0.5, 117.15, -6.2, 106.8);
    assert.ok(Math.abs(d1 - d2) < 0.001);
  });

  it('invalid coordinate throws', () => {
    assert.throws(() => haversineDistance(200, 117, 0, 0), /INVALID_COORDINATES/);
  });

  it('Earth radius constant is documented', () => {
    assert.equal(EARTH_RADIUS_METERS, 6371000);
  });
});
