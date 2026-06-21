import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchCancellationCommand } from '../../../src/services/location-intelligence/cancellation-detector.js';

describe('CancellationDetector — Task 2.7', () => {
  it('detects "batal"', () => {
    assert.ok(matchCancellationCommand('batal'));
  });

  it('detects "ganti lokasi"', () => {
    assert.ok(matchCancellationCommand('ganti lokasi'));
  });

  it('detects "cari lokasi lain"', () => {
    assert.ok(matchCancellationCommand('cari lokasi lain'));
  });

  it('detects "ulang dari awal"', () => {
    assert.ok(matchCancellationCommand('ulang dari awal'));
  });

  it('does not match normal text', () => {
    assert.equal(matchCancellationCommand('Jalan Biawan Samarinda'), false);
  });

  it('is case insensitive', () => {
    assert.ok(matchCancellationCommand('BATAL'));
  });
});
