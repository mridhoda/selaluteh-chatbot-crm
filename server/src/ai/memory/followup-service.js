const TRANSACTIONAL_EVENTS = new Set([
  'payment_reminder', 'payment_expiry',
  'order_accepted', 'preparing', 'ready_for_pickup', 'completed',
]);

const MARKETING_EVENTS = new Set([
  'feedback_request', 'abandoned_cart', 'promotion',
]);

const QUIET_HOURS_START = 21;
const QUIET_HOURS_END = 8;

const followups = new Map();
let idCounter = 0;

export function canSendProactive({ eventType, consent, optOut, quietHours }) {
  if (optOut) return { allowed: false, reason: 'opt_out' };

  if (MARKETING_EVENTS.has(eventType) && !consent) {
    return { allowed: false, reason: 'no_consent' };
  }

  if (quietHours) {
    const hour = new Date().getHours();
    if (hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END) {
      return { allowed: false, reason: 'quiet_hours' };
    }
  }

  return { allowed: true, reason: null };
}

export function scheduleFollowup({ workspaceId, contactId, chatId, eventType, dueAt, dedupeKey }) {
  if (followups.has(dedupeKey)) {
    return { success: false, reason: 'duplicate' };
  }

  idCounter++;
  const job = {
    id: `fup-${idCounter}`,
    workspaceId, contactId, chatId, eventType,
    dueAt: dueAt || new Date(Date.now() + 3600000).toISOString(),
    dedupeKey,
    status: 'scheduled',
    attemptCount: 0,
    createdAt: new Date().toISOString(),
  };
  followups.set(dedupeKey, job);
  return { success: true, job };
}

export function cancelFollowup({ dedupeKey }) {
  const job = followups.get(dedupeKey);
  if (!job) return { success: false, reason: 'not_found' };
  job.status = 'cancelled';
  return { success: true };
}

export function processDueFollowups({ stateChecker }) {
  const due = [];
  for (const [, job] of followups) {
    if (job.status !== 'scheduled') continue;
    if (new Date(job.dueAt) > new Date()) continue;
    if (stateChecker) {
      const state = stateChecker({ eventType: job.eventType, referenceId: job.dedupeKey });
      if (state?.suppressed) {
        job.status = 'cancelled';
        continue;
      }
    }
    due.push(job);
  }
  return due;
}
