import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle, PG_ERRORS } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'telegram_webhook_events';

function mapEvent(row) {
  return row ? mapRow(row) : null;
}

export const telegramWebhookEventsRepository = {
  async insertOnce(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      connection_id: data.connectionId,
      update_id: data.updateId,
      update_type: data.updateType || null,
      payload: data.payload || {},
      status: data.status || 'PENDING',
      attempt_count: data.attemptCount ?? 0,
      correlation_id: data.correlationId,
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    if (result.error?.code === PG_ERRORS.UNIQUE_VIOLATION) {
      const existing = await this.findByConnectionUpdateId({ connectionId: data.connectionId, updateId: data.updateId });
      return { event: existing, duplicate: true };
    }
    return { event: mapEvent(extractSingle(result, 'telegramWebhookEvents.insertOnce')), duplicate: false };
  },

  async findByConnectionUpdateId({ connectionId, updateId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('connection_id', connectionId)
      .eq('update_id', updateId)
      .maybeSingle();
    return mapEvent(extractSingle(result, 'telegramWebhookEvents.findByConnectionUpdateId'));
  },

  async claimNext({ now = new Date().toISOString() } = {}) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .in('status', ['PENDING', 'RETRY'])
      .lte('available_at', now)
      .order('received_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    const event = mapEvent(extractSingle(result, 'telegramWebhookEvents.claimNext.select'));
    if (!event) return null;

    const update = await client
      .from(TABLE)
      .update({
        status: 'PROCESSING',
        processing_started_at: new Date().toISOString(),
        attempt_count: (event.attemptCount ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', event.id)
      .in('status', ['PENDING', 'RETRY'])
      .select()
      .maybeSingle();
    return mapEvent(extractSingle(update, 'telegramWebhookEvents.claimNext.update'));
  },

  async markProcessed(eventId) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ status: 'PROCESSED', processed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', eventId)
      .select()
      .maybeSingle();
    return mapEvent(extractSingle(result, 'telegramWebhookEvents.markProcessed'));
  },

  async scheduleRetry({ eventId, availableAt, errorCode = 'TELEGRAM_EVENT_PROCESSING_FAILED', safeErrorMessage = '' }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: 'RETRY',
        available_at: availableAt,
        error_code: errorCode,
        safe_error_message: String(safeErrorMessage || '').slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .maybeSingle();
    return mapEvent(extractSingle(result, 'telegramWebhookEvents.scheduleRetry'));
  },

  async moveToDeadLetter({ eventId, errorCode = 'TELEGRAM_EVENT_DEAD_LETTERED', safeErrorMessage = '' }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        status: 'DEAD_LETTER',
        failed_at: new Date().toISOString(),
        error_code: errorCode,
        safe_error_message: String(safeErrorMessage || '').slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('id', eventId)
      .select()
      .maybeSingle();
    return mapEvent(extractSingle(result, 'telegramWebhookEvents.moveToDeadLetter'));
  },
};
