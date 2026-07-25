import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateModifierGroupCreate, validateModifierOptionsReplace } from '../../../src/validators/products.schema.js';

describe('modifier validation', () => {
  it('accepts a Size group and paid size options', () => {
    assert.deepEqual(validateModifierGroupCreate({ name: 'Size', selectionType: 'single', minSelection: 0, maxSelection: 1, outletScope: 'all_outlets' }), {
      value: { name: 'Size', selectionType: 'single', minSelection: 0, maxSelection: 1, outletScope: 'all_outlets' },
    });
    assert.deepEqual(validateModifierOptionsReplace({ options: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 4000 }] }), {
      value: { options: [{ name: 'Regular', priceDelta: 0 }, { name: 'Large', priceDelta: 4000 }] },
    });
  });

  it('rejects invalid selection bounds and option prices', () => {
    assert.ok(validateModifierGroupCreate({ name: 'Size', selectionType: 'single', minSelection: 0, maxSelection: 2, outletScope: 'all_outlets' }).error);
    assert.ok(validateModifierOptionsReplace({ options: [{ name: '', priceDelta: '4000' }] }).error);
  });
});
