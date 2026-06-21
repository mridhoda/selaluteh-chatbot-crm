import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactCoordinates, createSafeLogEntry } from '../../../src/services/location-intelligence/privacy-redactor.js';

describe('PrivacyRedactor — Section 21', () => {
  it('redacts exact coordinates from log message', () => {
    const msg = redactCoordinates('Customer at -0.502106,117.153709');
    assert.equal(msg, 'Customer at [REDACTED]');
  });

  it('redacts coordinates at end of string', () => {
    const msg = redactCoordinates('coords: -6.2 106.8');
    assert.equal(msg, 'coords: [REDACTED]');
  });

  it('creates safe log entry without coordinates', () => {
    const entry = createSafeLogEntry({ flowId: 'flow-1', city: 'Samarinda', status: 'RESOLVED', latitude: -0.5, longitude: 117 });
    assert.equal(entry.flowId, 'flow-1');
    assert.equal(entry.city, 'Samarinda');
    assert.equal(entry.latitude, undefined);
  });

  it('preserves city and status in safe log', () => {
    const entry = createSafeLogEntry({ flowId: 'flow-1', city: 'Samarinda', status: 'RESOLVED' });
    assert.equal(entry.city, 'Samarinda');
    assert.equal(entry.status, 'RESOLVED');
  });

  it('no raw provider payload in log', () => {
    const entry = createSafeLogEntry({ flowId: 'flow-1', rawProviderPayload: { secret: true } });
    assert.equal(entry.rawProviderPayload, undefined);
  });
});
