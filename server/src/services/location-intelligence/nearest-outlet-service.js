import { haversineDistance } from './haversine.js';

const OPEN_DISTANCE_TOLERANCE_METERS = 3000;
const DEFAULT_SERVICE_RADIUS_METERS = 25000;
const RECOMMENDED_COUNT = 1;
const ALTERNATIVES_MAX = 2;

export function findNearestOutlets(origin, eligibleOutlets) {
  const withDistance = sortByDistance(origin, eligibleOutlets);
  const withPreference = applyOpenPreference(withDistance, origin);
  const withRadius = withPreference.map(o => applyServiceRadius(o, DEFAULT_SERVICE_RADIUS_METERS));

  const recommendation = withRadius.length > 0 ? withRadius[0] : null;
  const alternatives = withRadius.length > 1 ? withRadius.slice(1, ALTERNATIVES_MAX + 1) : [];

  return { recommendation, alternatives };
}

export function sortByDistance(origin, outlets) {
  return outlets
    .map(o => {
      const distance = haversineDistance(origin.latitude, origin.longitude, o.latitude, o.longitude);
      return {
        outletId: o.outletId,
        name: o.name,
        formattedAddress: o.formattedAddress || '',
        approximateDistanceMeters: Math.round(distance),
        openingStatus: o.openingStatus || 'unknown',
        rankReason: o.rankReason || 'nearest_absolute',
        withinServiceRadius: true,
        googleMapsUrl: '',
      };
    })
    .sort((a, b) => {
      const d = a.approximateDistanceMeters - b.approximateDistanceMeters;
      if (d !== 0) return d;
      return a.outletId.localeCompare(b.outletId);
    });
}

export function applyOpenPreference(sortedOutlets, origin) {
  const open = sortedOutlets.filter(o => o.openingStatus === 'open');
  const closed = sortedOutlets.filter(o => o.openingStatus === 'closed');
  const unknown = sortedOutlets.filter(o => o.openingStatus === 'unknown');

  const nearestClosed = closed.length > 0 ? closed[0].approximateDistanceMeters : Infinity;
  const preferredOpen = open.find(o => o.approximateDistanceMeters <= nearestClosed + OPEN_DISTANCE_TOLERANCE_METERS);

  const result = [];

  if (preferredOpen) {
    preferredOpen.rankReason = 'nearest_open';
    result.push(preferredOpen);
    const remaining = sortedOutlets.filter(o => o.outletId !== preferredOpen.outletId);
    result.push(...remaining);
  } else {
    sortedOutlets.forEach(o => {
      o.rankReason = o.rankReason || 'nearest_absolute';
    });
    result.push(...sortedOutlets);
  }

  return result;
}

export function applyServiceRadius(outlet, radiusMeters) {
  const effectiveRadius = Math.max(0, radiusMeters);
  return {
    ...outlet,
    withinServiceRadius: outlet.approximateDistanceMeters <= effectiveRadius,
  };
}
