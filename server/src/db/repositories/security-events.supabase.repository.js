import { getSupabaseServiceClient } from '../supabase.js';
import { extractSingle } from '../supabase-errors.js';
import { redactSensitiveDetails } from '../../utils/audit-redaction.js';

const TABLE = 'security_events';

export const securityEventsRepository = {
  async log({ workspaceId = null, eventType, severity = 'low', ipAddress = null, userAgent = null, metadata = {} }) {
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert({
      workspace_id: workspaceId || null,
      event_type: eventType,
      severity,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      metadata_json: redactSensitiveDetails(metadata || {}),
    }).select().single();
    return extractSingle(result, 'security_events.log');
  },
};
