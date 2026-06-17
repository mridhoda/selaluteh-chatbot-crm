export const PRODUCT_CSV_COLUMNS = [
  'sku',
  'slug',
  'name',
  'shortDescription',
  'description',
  'basePrice',
  'currency',
  'isActive',
  'tags',
];

export function productsToCsv(products = []) {
  const rows = [PRODUCT_CSV_COLUMNS.join(',')];
  for (const product of products) {
    const source = product.toObject ? product.toObject() : product;
    rows.push(PRODUCT_CSV_COLUMNS.map((column) => escapeCsv(resolveColumn(source, column))).join(','));
  }
  return rows.join('\n');
}

export function validateProductImportRows(rows = []) {
  return rows.map((row, index) => {
    const errors = [];
    if (!row.name || typeof row.name !== 'string') errors.push('name is required');
    const price = Number(row.basePrice);
    if (Number.isNaN(price) || price < 0) errors.push('basePrice must be a non-negative number');
    if (row.isActive !== undefined && !['true', 'false', true, false].includes(row.isActive)) {
      errors.push('isActive must be true or false');
    }
    return { row: index + 1, valid: errors.length === 0, errors };
  });
}

function resolveColumn(product, column) {
  if (column === 'tags') return (product.tags || []).join('|');
  if (column === 'isActive') return product.isActive ? 'true' : 'false';
  return product[column] ?? '';
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (!/[",\n]/.test(str)) return str;
  return `"${str.replace(/"/g, '""')}"`;
}
