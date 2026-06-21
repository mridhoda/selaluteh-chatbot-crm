import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSafeLogEntry } from '../../../src/services/location-intelligence/privacy-redactor.js';

describe('Privacy — Durable Memory Prevention (Section 21.3)', () => {
  it('safe log entry contains no coordinates', () => {
    const entry = createSafeLogEntry({ flowId: 'f-1', latitude: -0.5, longitude: 117, city: 'Samarinda' });
    assert.equal(entry.latitude, undefined);
    assert.equal(entry.longitude, undefined);
    assert.equal(entry.city, 'Samarinda');
  });

  it('safe log entry has no raw provider payload', () => {
    const entry = createSafeLogEntry({ flowId: 'f-1', rawProviderPayload: { secret: 'data' } });
    assert.equal(entry.rawProviderPayload, undefined);
  });

  it('safe log entry has no api key', () => {
    const entry = createSafeLogEntry({ flowId: 'f-1', apiKey: 'sk-123' });
    assert.equal(entry.apiKey, undefined);
  });
});
