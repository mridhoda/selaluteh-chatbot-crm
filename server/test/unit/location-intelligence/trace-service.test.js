import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createTraceEntry, TRACE_FIELDS } from '../../../src/services/location-intelligence/trace-service.js';

describe('TraceService — Section 24', () => {
  it('creates trace with required fields', () => {
    const trace = createTraceEntry({ operation: 'resolve_text', workspaceId: 'ws-1', city: 'Samarinda', status: 'RESOLVED' });
    assert(trace.traceId);
    assert.equal(trace.operation, 'resolve_text');
    assert.equal(trace.status, 'RESOLVED');
  });

  it('no exact customer coordinates in trace', () => {
    const trace = createTraceEntry({ operation: 'resolve_text', workspaceId: 'ws-1', latitude: -0.5, longitude: 117 });
    assert.equal(trace.latitude, undefined);
    assert.equal(trace.longitude, undefined);
  });

  it('no raw provider payload in trace', () => {
    const trace = createTraceEntry({ operation: 'resolve_text', rawProviderPayload: { secret: 'data' } });
    assert.equal(trace.rawProviderPayload, undefined);
  });

  it('includes correlationId', () => {
    const trace = createTraceEntry({ operation: 'resolve_text', workspaceId: 'ws-1', correlationId: 'corr-1' });
    assert.equal(trace.correlationId, 'corr-1');
  });
});
