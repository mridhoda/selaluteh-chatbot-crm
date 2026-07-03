import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildInvalidAddressReply,
  validateCustomerLocationText,
} from '../../../src/services/location-intelligence/nearest-outlet-reply.service.js';

describe('location address validation', () => {
  it('rejects contradictory Indonesian admin terms with foreign city', () => {
    const result = validateCustomerLocationText('alamat di margasari gg. kuburan hijau no.29 rt.1 kel.newyork');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'contradictory_address');
  });

  it('rejects unsupported foreign location', () => {
    const result = validateCustomerLocationText('saya di New York');
    assert.equal(result.valid, false);
    assert.equal(result.reason, 'outside_supported_area');
  });

  it('accepts supported local city address', () => {
    const result = validateCustomerLocationText('Jl Jelawat Samarinda');
    assert.equal(result.valid, true);
  });

  it('builds verification prompt for contradictory address', () => {
    const reply = buildInvalidAddressReply('contradictory_address');
    assert.match(reply, /verifikasi alamat/i);
    assert.match(reply, /Google Maps/i);
  });
});
