import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeConfidence } from '../../../src/services/location-intelligence/confidence-normalizer.js';

describe('ConfidenceNormalizer — Section 5.6', () => {
  it('single candidate city match street precision = high', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'street', cityMatch: true }), 'high');
  });
  it('single candidate city match rooftop precision = high', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'rooftop', cityMatch: true }), 'high');
  });
  it('single candidate city match area precision = medium', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'area', cityMatch: true }), 'medium');
  });
  it('single candidate city match city precision = low', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'city', cityMatch: true }), 'low');
  });
  it('multiple candidates = low', () => {
    assert.equal(computeConfidence({ candidateCount: 3, precision: 'street', cityMatch: true }), 'low');
  });
  it('no city match = low', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'street', cityMatch: false }), 'low');
  });
  it('unknown precision with single city match = low', () => {
    assert.equal(computeConfidence({ candidateCount: 1, precision: 'unknown', cityMatch: true }), 'low');
  });
});
