import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  LocationInputType,
  isValidLocationInput,
  MAX_LOCATION_INPUT_LENGTH,
} from '../../../src/services/location-intelligence/location-input.js';

describe('LocationInput — Task 1.5', () => {
  describe('Input types', () => {
    it('has all required types', () => {
      assert.equal(LocationInputType.TEXT, 'text');
      assert.equal(LocationInputType.STRUCTURED_FIELDS, 'structured_fields');
      assert.equal(LocationInputType.SHARED_COORDINATES, 'shared_coordinates');
      assert.equal(LocationInputType.GOOGLE_MAPS_URL, 'google_maps_url');
      assert.equal(LocationInputType.CANDIDATE_SELECTION, 'candidate_selection');
    });
  });

  describe('Strict schema — text input', () => {
    it('valid text input accepted', () => {
      const result = isValidLocationInput({ inputType: 'text', text: 'Jalan Biawan Samarinda' });
      assert.equal(result.valid, true);
    });

    it('text input too long rejected', () => {
      const longText = 'x'.repeat(MAX_LOCATION_INPUT_LENGTH + 1);
      const result = isValidLocationInput({ inputType: 'text', text: longText });
      assert.equal(result.valid, false);
      assert(result.error.includes('TOO_LARGE'));
    });

    it('empty text rejected', () => {
      const result = isValidLocationInput({ inputType: 'text', text: '' });
      assert.equal(result.valid, false);
    });

    it('missing text for text type rejected', () => {
      const result = isValidLocationInput({ inputType: 'text' });
      assert.equal(result.valid, false);
    });
  });

  describe('Strict schema — structured fields', () => {
    it('valid structured input accepted', () => {
      const result = isValidLocationInput({
        inputType: 'structured_fields',
        city: 'Samarinda',
        street: 'Jalan Biawan',
      });
      assert.equal(result.valid, true);
    });

    it('structured input without city rejected', () => {
      const result = isValidLocationInput({
        inputType: 'structured_fields',
        street: 'Jalan Biawan',
      });
      assert.equal(result.valid, false);
    });
  });

  describe('Strict schema — shared coordinates', () => {
    it('valid coordinates accepted', () => {
      const result = isValidLocationInput({
        inputType: 'shared_coordinates',
        latitude: -0.502106,
        longitude: 117.153709,
      });
      assert.equal(result.valid, true);
    });

    it('invalid coordinates rejected', () => {
      const result = isValidLocationInput({
        inputType: 'shared_coordinates',
        latitude: 200,
        longitude: 117,
      });
      assert.equal(result.valid, false);
    });
  });

  describe('Mutually incompatible fields handled', () => {
    it('cannot combine text and coordinates', () => {
      const result = isValidLocationInput({
        inputType: 'text',
        text: 'Jalan Biawan',
        latitude: -0.5,
        longitude: 117,
      });
      assert.equal(result.valid, false);
    });
  });

  describe('Unknown fields rejected', () => {
    it('unknown inputType rejected', () => {
      const result = isValidLocationInput({ inputType: 'gps_coordinates' });
      assert.equal(result.valid, false);
    });

    it('null inputType rejected', () => {
      const result = isValidLocationInput({});
      assert.equal(result.valid, false);
    });
  });

  describe('Arbitrary provider endpoint forbidden', () => {
    it('custom provider endpoint in input rejected', () => {
      const result = isValidLocationInput({
        inputType: 'text',
        text: 'Jalan Biawan Samarinda',
        customProviderEndpoint: 'http://evil.com',
      });
      assert.equal(result.valid, false);
    });
  });
});
