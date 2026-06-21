import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { matchConfirmationInput, findOutletByIndex } from '../../../src/services/location-intelligence/confirmation-input-mapper.js';

describe('ConfirmationInputMapper — Section 17.2', () => {
  it('ya returns confirm', () => {
    assert.equal(matchConfirmationInput('ya'), 'confirm');
  });
  it('pilih yang pertama returns select 1', () => {
    assert.equal(matchConfirmationInput('pilih yang pertama'), 'select:0');
  });
  it('pilih alternatif kedua returns select 1', () => {
    assert.equal(matchConfirmationInput('pilih alternatif kedua'), 'select:1');
  });
  it('batal returns cancel', () => {
    assert.equal(matchConfirmationInput('batal'), 'cancel');
  });
  it('cari lokasi lain returns new_search', () => {
    assert.equal(matchConfirmationInput('cari lokasi lain'), 'new_search');
  });
  it('normal text returns null', () => {
    assert.equal(matchConfirmationInput('Jalan Biawan'), null);
  });
  it('empty returns null', () => {
    assert.equal(matchConfirmationInput(''), null);
  });
  it('findOutletByIndex returns correct item', () => {
    const outlets = [{ outletId: 'o1' }, { outletId: 'o2' }, { outletId: 'o3' }];
    assert.equal(findOutletByIndex(outlets, 0).outletId, 'o1');
    assert.equal(findOutletByIndex(outlets, 1).outletId, 'o2');
  });
  it('findOutletByIndex out of range returns null', () => {
    assert.equal(findOutletByIndex([{ outletId: 'o1' }], 5), null);
  });
});
