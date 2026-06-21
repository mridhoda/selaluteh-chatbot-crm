const STRATEGY_MAP = {
  street: 'geocode',
  postal_code: 'geocode',
  structured_address: 'geocode',
  landmark: 'place_search',
  place_name: 'place_search',
  building: 'place_search',
};

export function selectResolutionStrategy(fieldType, noCity = false) {
  if (noCity) return 'incomplete';
  return STRATEGY_MAP[fieldType] || 'geocode';
}
