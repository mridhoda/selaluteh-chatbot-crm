import { OutletOperationalStatus, OutletOpenState } from './outlet-status.js';

const OPENING_SOON_WINDOW_MINUTES = 30;
const CLOSING_SOON_WINDOW_MINUTES = 30;

function parseTime(t) {
  if (!t) return null;
  if (typeof t === 'string') return t;
  if (t?.hours !== undefined) {
    const h = String(t.hours).padStart(2, '0');
    const m = String(t.minutes ?? 0).padStart(2, '0');
    return `${h}:${m}`;
  }
  return null;
}

function minutesSinceMidnight(timeStr) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number);
  return h * 60 + m;
}

export function computeOpenState({ timezone, regularHours, specialHours, referenceDate }) {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  const options = { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
  const localTimeStr = now.toLocaleTimeString('en-CA', options);
  const localMinutes = minutesSinceMidnight(localTimeStr);

  const dayOfWeek = (() => {
    try {
      return parseInt(now.toLocaleDateString('en-CA', { timeZone: timezone, weekday: 'numeric' })) - 1;
    } catch {
      return now.getDay();
    }
  })();

  const localDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });

  // Check special hours first
  if (specialHours && specialHours.length > 0) {
    const todaySpecial = specialHours.find(s => s.date === localDateStr);
    if (todaySpecial) {
      if (todaySpecial.is_closed) {
        const nextRegular = findNextOpening(localMinutes, dayOfWeek, regularHours);
        return { state: OutletOpenState.CLOSED, reason: 'special_closure', nextTransitionAt: nextRegular?.iso };
      }
      if (todaySpecial.opens_at && todaySpecial.closes_at) {
        const openMin = minutesSinceMidnight(todaySpecial.opens_at);
        const closeMin = minutesSinceMidnight(todaySpecial.closes_at);
        if (localMinutes >= openMin && localMinutes < closeMin) {
          if (closeMin - localMinutes <= CLOSING_SOON_WINDOW_MINUTES) {
            return { state: OutletOpenState.CLOSING_SOON, nextTransitionAt: computeIso(timezone, now, todaySpecial.closes_at) };
          }
          return { state: OutletOpenState.OPEN, nextTransitionAt: computeIso(timezone, now, todaySpecial.closes_at) };
        }
        if (localMinutes < openMin) {
          if (openMin - localMinutes <= OPENING_SOON_WINDOW_MINUTES) {
            return { state: OutletOpenState.OPENING_SOON, nextTransitionAt: computeIso(timezone, now, todaySpecial.opens_at) };
          }
          return { state: OutletOpenState.CLOSED, nextTransitionAt: computeIso(timezone, now, todaySpecial.opens_at) };
        }
      }
    }
  }

  // Fall back to regular hours
  if (!regularHours || regularHours.length === 0) {
    return { state: OutletOpenState.UNKNOWN, reason: 'no_schedule' };
  }

  const todayIntervals = regularHours
    .filter(h => h.day_of_week === dayOfWeek && !h.is_closed)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  if (todayIntervals.length === 0) {
    const next = findNextOpening(localMinutes, dayOfWeek, regularHours);
    return { state: OutletOpenState.CLOSED, reason: 'scheduled_off', nextTransitionAt: next?.iso };
  }

  for (const interval of todayIntervals) {
    const openMin = minutesSinceMidnight(parseTime(interval.opens_at));
    const closeMin = minutesSinceMidnight(parseTime(interval.closes_at));

    if (localMinutes >= openMin && localMinutes < closeMin) {
      if (closeMin - localMinutes <= CLOSING_SOON_WINDOW_MINUTES) {
        return { state: OutletOpenState.CLOSING_SOON, nextTransitionAt: computeIso(timezone, now, interval.closes_at) };
      }
      return { state: OutletOpenState.OPEN, nextTransitionAt: computeIso(timezone, now, interval.closes_at) };
    }

    if (localMinutes < openMin) {
      if (openMin - localMinutes <= OPENING_SOON_WINDOW_MINUTES) {
        return { state: OutletOpenState.OPENING_SOON, nextTransitionAt: computeIso(timezone, now, interval.opens_at) };
      }
      return { state: OutletOpenState.CLOSED, nextTransitionAt: computeIso(timezone, now, interval.opens_at) };
    }
  }

  const next = findNextOpening(localMinutes, dayOfWeek, regularHours);
  return { state: OutletOpenState.CLOSED, nextTransitionAt: next?.iso };
}

function findNextOpening(currentMinutes, currentDay, regularHours) {
  for (let offset = 0; offset < 14; offset++) {
    const checkDay = (currentDay + offset) % 7;
    const intervals = regularHours.filter(h => h.day_of_week === checkDay && !h.is_closed).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    if (intervals.length === 0) continue;

    const firstInterval = intervals[0];
    const openMin = minutesSinceMidnight(parseTime(firstInterval.opens_at));
    if (offset === 0 && openMin <= currentMinutes) continue;

    const daysFromNow = offset;
    return { dayOffset: daysFromNow, time: firstInterval.opens_at, iso: null };
  }
  return null;
}

function computeIso(timezone, now, timeStr) {
  try {
    const [h, m] = (timeStr || '00:00').split(':').map(Number);
    const datePart = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const localIso = `${datePart}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
    return localIso;
  } catch {
    return null;
  }
}
