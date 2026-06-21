import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { selectResolutionStrategy } from '../../../src/services/location-intelligence/strategy-selector.js';

describe('StrategySelector — Task 5.2', () => {
  it('street selects geocode', () => {
    assert.equal(selectResolutionStrategy('street'), 'geocode');
  });

  it('postal code selects geocode', () => {
    assert.equal(selectResolutionStrategy('postal_code'), 'geocode');
  });

  it('structured address selects geocode', () => {
    assert.equal(selectResolutionStrategy('structured_address'), 'geocode');
  });

  it('landmark selects place_search', () => {
    assert.equal(selectResolutionStrategy('landmark'), 'place_search');
  });

  it('place name selects place_search', () => {
    assert.equal(selectResolutionStrategy('place_name'), 'place_search');
  });

  it('building selects place_search', () => {
    assert.equal(selectResolutionStrategy('building'), 'place_search');
  });

  it('unknown field type defaults to geocode', () => {
    assert.equal(selectResolutionStrategy('unknown'), 'geocode');
  });

  it('no city prevents provider call', () => {
    assert.equal(selectResolutionStrategy(null, true), 'incomplete');
  });
});
