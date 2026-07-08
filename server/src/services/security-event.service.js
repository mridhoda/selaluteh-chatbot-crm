import { securityEventsRepository } from '../db/repositories/security-events.supabase.repository.js';

export async function recordSecurityEvent({ workspaceId = null, eventType, severity = 'low', req = null, ipAddress = null, userAgent = null, metadata = {} }, deps = {}) {
  if (!eventType) return null;
  const repo = deps.securityEventsRepository || securityEventsRepository;
  try {
    return await repo.log({
      workspaceId,
      eventType,
      severity,
      ipAddress: ipAddress || req?.ip || null,
      userAgent: userAgent || req?.get?.('user-agent') || req?.headers?.['user-agent'] || null,
      metadata,
    });
  } catch (err) {
    console.error(`[SecurityEvent] Failed to record ${eventType}:`, err.message);
    return null;
  }
}
