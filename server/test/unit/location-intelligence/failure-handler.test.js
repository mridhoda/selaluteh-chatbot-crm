import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { handleFailure, FAILURE_BEHAVIORS } from '../../../src/services/location-intelligence/failure-handler.js';

describe('FailureHandler — Section 25', () => {
  it('invalid input returns clarification', () => {
    const result = handleFailure('invalid_input', {});
    assert.equal(result.behavior, 'targeted-clarification');
  });

  it('provider timeout returns retry suggestion', () => {
    const result = handleFailure('provider_timeout', {});
    assert.equal(result.behavior, 'retry-later-or-add-detail');
  });

  it('no eligible outlet returns clear status', () => {
    const result = handleFailure('no_eligible_outlet', {});
    assert.equal(result.behavior, 'no-eligible-outlet');
  });

  it('outside radius returns informational', () => {
    const result = handleFailure('outside_radius', {});
    assert.equal(result.behavior, 'outside-radius-info');
  });

  it('unknown failure type returns generic error', () => {
    const result = handleFailure('unknown_error', {});
    assert.equal(result.behavior, 'generic-error');
  });
});
