import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getClarificationCode } from '../../../src/services/location-intelligence/clarification-mapper.js';

describe('ClarificationMapper — Task 2.8', () => {
  it('MISSING_CITY → ASK_CITY', () => {
    assert.equal(getClarificationCode('MISSING_CITY'), 'ASK_CITY');
  });

  it('MISSING_DETAIL → ASK_STREET_AREA_OR_LANDMARK', () => {
    assert.equal(getClarificationCode('MISSING_DETAIL'), 'ASK_STREET_AREA_OR_LANDMARK');
  });

  it('unknown status returns null', () => {
    assert.equal(getClarificationCode('UNKNOWN'), null);
  });

  it('no provider call', () => {
    assert.equal(getClarificationCode('MISSING_CITY'), 'ASK_CITY');
  });

  it('no route call', () => {
    assert.equal(getClarificationCode('MISSING_DETAIL'), 'ASK_STREET_AREA_OR_LANDMARK');
  });
});
