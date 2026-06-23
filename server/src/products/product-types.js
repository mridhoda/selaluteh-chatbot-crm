export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
};

export const ProductType = {
  STANDARD: 'STANDARD',
};

export const PRODUCT_ERRORS = {
  NOT_FOUND: { code: 'PRODUCT_NOT_FOUND', status: 404 },
  INVALID_STATUS: { code: 'PRODUCT_INVALID_STATUS', status: 400 },
  DUPLICATE_SKU: { code: 'PRODUCT_DUPLICATE_SKU', status: 409 },
  NOT_AVAILABLE_AT_OUTLET: { code: 'PRODUCT_NOT_AVAILABLE_AT_OUTLET', status: 400 },
};
