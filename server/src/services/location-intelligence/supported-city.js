export function createSupportedCity(fields) {
  return {
    cityKey: fields.cityKey,
    displayName: fields.displayName,
    province: fields.province || null,
    countryCode: fields.countryCode || 'ID',
    aliases: fields.aliases || [],
    eligibleOutletCount: fields.eligibleOutletCount || 0,
  };
}

export function isValidSupportedCity(city) {
  if (!city) return false;
  if (!city.cityKey || !city.displayName) return false;
  return true;
}

export function deriveSupportedCities(outlets, workspaceId) {
  const cityMap = new Map();

  for (const outlet of outlets) {
    if (workspaceId && outlet.workspaceId && outlet.workspaceId !== workspaceId) continue;
    if (!outlet.active) continue;
    if (!outlet.pickupEnabled) continue;
    if (outlet.deletedAt) continue;
    if (outlet.locationStatus !== 'VERIFIED') continue;

    const city = outlet.city;
    if (!city) continue;

    const key = city.toLowerCase().trim();
    if (!cityMap.has(key)) {
      cityMap.set(key, {
        cityKey: key,
        displayName: city,
        province: outlet.province || null,
        countryCode: 'ID',
        aliases: [],
        eligibleOutletCount: 0,
      });
    }
    cityMap.get(key).eligibleOutletCount++;
  }

  return Array.from(cityMap.values());
}
