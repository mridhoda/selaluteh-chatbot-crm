export function getEffectiveRadius({ outletGroup, city, workspace, platform }) {
  if (outletGroup && outletGroup.serviceRadiusMeters != null) return Math.max(0, outletGroup.serviceRadiusMeters);
  if (city && city.serviceRadiusMeters != null) return Math.max(0, city.serviceRadiusMeters);
  if (workspace && workspace.serviceRadiusMeters != null) return Math.max(0, workspace.serviceRadiusMeters);
  return 25000;
}
