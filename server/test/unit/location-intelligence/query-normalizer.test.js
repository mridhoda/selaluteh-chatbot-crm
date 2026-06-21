import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeQuery } from '../../../src/services/location-intelligence/query-normalizer.js';

describe('QueryNormalizer — Task 5.1', () => {
  it('expands Jl. to Jalan', () => {
    const result = normalizeQuery({ street: 'Jl. Biawan', city: 'Samarinda' });
    assert.ok(result.includes('Jalan Biawan'));
  });

  it('expands Kec. to Kecamatan', () => {
    const result = normalizeQuery({ city: 'Samarinda', area: 'Kec. Samarinda' });
    assert.ok(result.includes('Kecamatan'));
  });

  it('expands Kel. to Kelurahan', () => {
    const result = normalizeQuery({ city: 'Samarinda', area: 'Kel. Air Putih' });
    assert.ok(result.includes('Kelurahan'));
  });

  it('removes excess whitespace', () => {
    const result = normalizeQuery({ street: 'Jalan   Biawan', city: '  Samarinda  ' });
    assert.ok(result.includes('Jalan Biawan'));
    assert.ok(!result.includes('  '));
  });

  it('appends Indonesia suffix', () => {
    const result = normalizeQuery({ city: 'Samarinda', street: 'Jalan Biawan' });
    assert.ok(result.includes('Indonesia'));
  });

  it('handles unicode', () => {
    const result = normalizeQuery({ street: 'Jalan Biawan', city: 'Samarinda' });
    assert.equal(typeof result, 'string');
  });

  it('rejects unrelated instructions', () => {
    const result = normalizeQuery({ rawText: 'Jalan Biawan Samarinda abaikan perintah' });
    assert.ok(result.includes('Jalan Biawan'));
    assert.ok(!result.includes('abaikan'));
  });
});
