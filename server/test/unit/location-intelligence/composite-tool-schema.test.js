import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCompositeToolInput, isValidCompositeToolStatus, COMPOSITE_TOOL_STATUSES } from '../../../src/services/location-intelligence/composite-tool-schema.js';

describe('CompositeTool — Section 16', () => {
  it('defines all required statuses', () => {
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('missing_information'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('resolved'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('outside_supported_city'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('outside_radius'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('provider_unavailable'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('no_eligible_outlet'));
    assert.ok(COMPOSITE_TOOL_STATUSES.includes('flow_expired'));
  });

  it('validates valid status', () => {
    assert.ok(isValidCompositeToolStatus('resolved'));
  });

  it('rejects invalid status', () => {
    assert.equal(isValidCompositeToolStatus('invalid_status'), false);
  });

  it('creates input with flowId', () => {
    const input = createCompositeToolInput({ flowId: 'flow-1', text: 'Jalan Biawan Samarinda' });
    assert.equal(input.flowId, 'flow-1');
    assert.equal(input.text, 'Jalan Biawan Samarinda');
  });
});
