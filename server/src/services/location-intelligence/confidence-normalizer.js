const PRECISION_RANK = { rooftop: 5, street: 4, landmark: 3, postal_code: 3, area: 2, city: 1, unknown: 0 };

export function computeConfidence({ candidateCount, precision, cityMatch }) {
  if (!cityMatch) return 'low';
  if (candidateCount > 1) return 'low';

  const rank = PRECISION_RANK[precision] || 0;
  if (rank >= 4) return 'high';
  if (rank >= 2) return 'medium';
  return 'low';
}
