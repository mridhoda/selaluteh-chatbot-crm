import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ProductStatus, ProductType, PRODUCT_ERRORS } from '../../../src/products/product-types.js';

describe('product-types', () => {
  it('has expected statuses', () => {
    assert.strictEqual(ProductStatus.DRAFT, 'DRAFT');
    assert.strictEqual(ProductStatus.ACTIVE, 'ACTIVE');
    assert.strictEqual(ProductStatus.ARCHIVED, 'ARCHIVED');
  });

  it('has STANDARD product type', () => {
    assert.strictEqual(ProductType.STANDARD, 'STANDARD');
  });

  it('has error codes', () => {
    assert.strictEqual(PRODUCT_ERRORS.DUPLICATE_SKU.code, 'PRODUCT_DUPLICATE_SKU');
    assert.strictEqual(PRODUCT_ERRORS.NOT_AVAILABLE_AT_OUTLET.code, 'PRODUCT_NOT_AVAILABLE_AT_OUTLET');
  });
});
