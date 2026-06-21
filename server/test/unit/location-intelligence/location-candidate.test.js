import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLocationCandidate,
  isValidCandidate,
  ConfidenceLevel,
  PrecisionLevel,
  sanitizeForCustomer,
} from '../../../src/services/location-intelligence/location-candidate.js';

describe('LocationCandidate — Task 1.6', () => {
  describe('Confidence enum', () => {
    it('has all required levels', () => {
      assert.equal(ConfidenceLevel.HIGH, 'high');
      assert.equal(ConfidenceLevel.MEDIUM, 'medium');
      assert.equal(ConfidenceLevel.LOW, 'low');
    });
  });

  describe('Precision enum', () => {
    it('has all required levels', () => {
      assert.equal(PrecisionLevel.ROOFTOP, 'rooftop');
      assert.equal(PrecisionLevel.STREET, 'street');
      assert.equal(PrecisionLevel.AREA, 'area');
      assert.equal(PrecisionLevel.LANDMARK, 'landmark');
      assert.equal(PrecisionLevel.CITY, 'city');
      assert.equal(PrecisionLevel.POSTAL_CODE, 'postal_code');
      assert.equal(PrecisionLevel.UNKNOWN, 'unknown');
    });
  });

  describe('Candidate creation', () => {
    it('creates valid candidate with required fields', () => {
      const c = createLocationCandidate({
        candidateId: 'cand-1',
        provider: 'google',
        label: 'Jalan Biawan, Samarinda',
        latitude: -0.502106,
        longitude: 117.153709,
        confidence: 'high',
        precision: 'street',
      });
      assert.ok(isValidCandidate(c));
      assert.equal(c.candidateId, 'cand-1');
      assert.equal(c.city, undefined);
    });

    it('creates candidate with all optional fields', () => {
      const c = createLocationCandidate({
        candidateId: 'cand-1',
        provider: 'google',
        providerPlaceId: 'ChIJ123',
        label: 'Jalan Biawan, Samarinda',
        formattedAddress: 'Jalan Biawan, Samarinda, Kaltim, Indonesia',
        city: 'Samarinda',
        province: 'Kalimantan Timur',
        countryCode: 'ID',
        latitude: -0.502106,
        longitude: 117.153709,
        confidence: 'high',
        precision: 'street',
      });
      assert.ok(isValidCandidate(c));
      assert.equal(c.city, 'Samarinda');
      assert.equal(c.providerPlaceId, 'ChIJ123');
    });
  });

  describe('Coordinate validation', () => {
    it('invalid latitude fails validation', () => {
      const c = createLocationCandidate({
        candidateId: 'cand-1',
        provider: 'google',
        label: 'Test',
        latitude: 200,
        longitude: 117,
        confidence: 'high',
        precision: 'street',
      });
      assert.equal(isValidCandidate(c), false);
    });
  });

  describe('Candidate ID opaque', () => {
    it('candidateId is required', () => {
      const c = createLocationCandidate({
        provider: 'google',
        label: 'Test',
        latitude: -0.5,
        longitude: 117,
        confidence: 'high',
        precision: 'street',
      });
      assert.equal(c.candidateId, undefined);
      assert.equal(isValidCandidate(c), false);
    });
  });

  describe('Customer-safe serialization', () => {
    it('excludes raw provider data', () => {
      const c = createLocationCandidate({
        candidateId: 'cand-1',
        provider: 'google',
        providerPlaceId: 'ChIJ123',
        label: 'Jalan Biawan',
        formattedAddress: 'Jalan Biawan, Samarinda',
        city: 'Samarinda',
        latitude: -0.502106,
        longitude: 117.153709,
        confidence: 'high',
        precision: 'street',
        rawProviderResponse: { secret: 'data' },
      });
      const safe = sanitizeForCustomer(c);
      assert.equal(safe.candidateId, 'cand-1');
      assert.equal(safe.label, 'Jalan Biawan');
      assert.equal(safe.rawProviderResponse, undefined);
      assert.equal(safe.provider, undefined);
    });

    it('preserves customer-safe fields', () => {
      const c = createLocationCandidate({
        candidateId: 'cand-1',
        provider: 'google',
        label: 'Test',
        latitude: -0.5,
        longitude: 117,
        confidence: 'high',
        precision: 'street',
      });
      const safe = sanitizeForCustomer(c);
      assert.equal(safe.candidateId, 'cand-1');
      assert.equal(safe.label, 'Test');
      assert.equal(safe.confidence, 'high');
    });
  });
});
