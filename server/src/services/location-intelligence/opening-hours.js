export function checkOpeningStatus(openingHours, timezone, referenceTime) {
  if (!openingHours || !openingHours.regular) return 'unknown';

  const now = referenceTime || new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayIndex = now.getUTCDay();
  const dayLabel = dayNames[dayIndex];
  const minutesSinceMidnight = now.getUTCHours() * 60 + now.getUTCMinutes();

  const todaySchedule = openingHours.regular[dayLabel];
  if (!todaySchedule || todaySchedule.length === 0) return 'closed';

  for (const period of todaySchedule) {
    if (!period.open || !period.close) continue;
    const openMinutes = parseTime(period.open);
    const closeMinutes = parseTime(period.close);
    if (minutesSinceMidnight >= openMinutes && minutesSinceMidnight < closeMinutes) return 'open';
  }

  return 'closed';
}

function parseTime(str) {
  const [h, m] = str.split(':').map(Number);
  return h * 60 + (m || 0);
}
