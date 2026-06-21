export function validateCityConsistency(candidates, requestedCity) {
  if (!requestedCity) return { valid: true, reason: 'no_city_to_validate' };

  const requestedLower = requestedCity.toLowerCase().trim();

  for (const c of candidates) {
    if (!c.city) continue;
    if (c.city.toLowerCase().trim() === requestedLower) {
      return { valid: true, reason: 'city_match', candidate: c };
    }
  }

  const withCity = candidates.filter(c => c.city);
  if (withCity.length > 0) {
    return { valid: false, reason: 'city_mismatch', matchedCity: withCity[0].city, candidates: withCity };
  }

  return { valid: false, reason: 'no_city_in_candidates', candidates };
}
