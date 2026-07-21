export function validateProductCreate(body = {}) {
  const errors = [];

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    errors.push('name is required');
  }
  if (body.name && body.name.length > 200) {
    errors.push('name must be at most 200 characters');
  }
  if (body.basePrice === undefined || body.basePrice === null) {
    errors.push('basePrice is required');
  } else if (typeof body.basePrice !== 'number' || isNaN(body.basePrice) || body.basePrice < 0) {
    errors.push('basePrice must be a non-negative number');
  }
  if (body.costPrice !== undefined && body.costPrice !== null) {
    if (typeof body.costPrice !== 'number' || isNaN(body.costPrice) || body.costPrice < 0) {
      errors.push('costPrice must be a non-negative number');
    }
  }
  if (body.currency && typeof body.currency !== 'string') {
    errors.push('currency must be a string');
  }
  if (body.tags && !Array.isArray(body.tags)) {
    errors.push('tags must be an array');
  }
  if (body.status && !['active', 'inactive', 'archived'].includes(body.status)) {
    errors.push('status must be one of: active, inactive, archived');
  }
  if (body.thumbnailUrl && typeof body.thumbnailUrl !== 'string') {
    errors.push('thumbnailUrl must be a string');
  }

  if (errors.length) {
    return { error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } };
  }

  return { value: body };
}

export function validateProductUpdate(body = {}) {
  const errors = [];

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) errors.push('name must be a non-empty string');
    if (body.name.length > 200) errors.push('name must be at most 200 characters');
  }
  if (body.basePrice !== undefined) {
    if (typeof body.basePrice !== 'number' || isNaN(body.basePrice) || body.basePrice < 0) {
      errors.push('basePrice must be a non-negative number');
    }
  }
  if (body.costPrice !== undefined && body.costPrice !== null) {
    if (typeof body.costPrice !== 'number' || isNaN(body.costPrice) || body.costPrice < 0) {
      errors.push('costPrice must be a non-negative number');
    }
  }
  if (body.currency !== undefined && typeof body.currency !== 'string') {
    errors.push('currency must be a string');
  }
  if (body.tags !== undefined && !Array.isArray(body.tags)) {
    errors.push('tags must be an array');
  }
  if (body.status !== undefined && !['active', 'inactive', 'archived'].includes(body.status)) {
    errors.push('status must be one of: active, inactive, archived');
  }

  if (errors.length) {
    return { error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } };
  }

  return { value: body };
}

export function validateProductAvailability(body = {}) {
  const errors = [];

  if (!body.outlets || !Array.isArray(body.outlets) || body.outlets.length === 0) {
    errors.push('outlets array is required');
  } else {
    for (const item of body.outlets) {
      const outletId = item.outletId || item.outlet_id;
      if (!outletId) errors.push('each outlet entry must have outletId');

      if (item.isAvailable !== undefined && typeof item.isAvailable !== 'boolean') {
        errors.push('isAvailable must be a boolean');
      }
      if (item.priceOverride !== undefined && item.price_override !== undefined) {
        errors.push('use either priceOverride or price_override, not both');
      }
      if (item.priceOverride != null && item.price_override != null) {
        const price = item.priceOverride ?? item.price_override;
        if (typeof price !== 'number' || isNaN(price) || price < 0) {
          errors.push('priceOverride must be a non-negative number');
        }
      }
      if (item.status && !['active', 'inactive', 'sold_out', 'available', 'unavailable'].includes(item.status)) {
        errors.push(`invalid status: ${item.status}`);
      }
      if (item.availableFrom && isNaN(Date.parse(item.availableFrom))) {
        errors.push('availableFrom must be a valid date');
      }
      if (item.availableUntil && isNaN(Date.parse(item.availableUntil))) {
        errors.push('availableUntil must be a valid date');
      }
    }
  }

  if (errors.length) {
    return { error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } };
  }

  return { value: body };
}

export function validateModifierGroupCreate(body = {}) {
  const errors = [];
  if (typeof body.name !== 'string' || !body.name.trim()) errors.push('name is required');
  if (typeof body.name === 'string' && body.name.trim().length > 120) errors.push('name must be at most 120 characters');
  if (!['single', 'multi'].includes(body.selectionType)) errors.push('selectionType must be single or multi');
  if (!['all_outlets', 'selected_outlets'].includes(body.outletScope)) errors.push('outletScope is invalid');
  if (!Number.isInteger(body.minSelection) || body.minSelection < 0) errors.push('minSelection must be a non-negative integer');
  if (!Number.isInteger(body.maxSelection) || body.maxSelection < body.minSelection) errors.push('maxSelection must be an integer not below minSelection');
  if (body.selectionType === 'single' && body.maxSelection !== 1) errors.push('single selection requires maxSelection of 1');
  if (body.description !== undefined && (typeof body.description !== 'string' || body.description.length > 500)) errors.push('description must be at most 500 characters');
  if (errors.length) return { error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } };
  return { value: body };
}

export function validateModifierOptionsReplace(body = {}) {
  const errors = [];
  if (!Array.isArray(body.options) || body.options.length > 50) errors.push('options must contain at most 50 entries');
  for (const option of body.options || []) {
    if (typeof option?.name !== 'string' || !option.name.trim() || option.name.trim().length > 120) errors.push('each option needs a name of at most 120 characters');
    if (typeof option?.priceDelta !== 'number' || !Number.isFinite(option.priceDelta)) errors.push('each option priceDelta must be a number');
  }
  if (errors.length) return { error: { code: 'VALIDATION_ERROR', message: errors.join('; ') } };
  return { value: body };
}
