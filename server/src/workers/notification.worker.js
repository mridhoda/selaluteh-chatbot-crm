/**
 * notification.worker.js — Task 17.6
 *
 * In-process notification delivery worker. This intentionally stays simple for
 * MVP; durable distributed queues remain a later operations task.
 */

import { getSupabaseServiceClient } from '../db/supabase.js';
import { buildNotificationTemplate, deliverNotificationMessage } from '../services/notification.service.js';

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_BATCH_SIZE = 20;

let timer = null;
let running = false;

export function startNotificationWorker({ intervalMs = DEFAULT_INTERVAL_MS, batchSize = DEFAULT_BATCH_SIZE } = {}) {
  if (timer) return { started: false, reason: 'already_started' };
  timer = setInterval(() => {
    processPendingNotifications({ limit: batchSize }).catch((err) => {
      console.error('[notification-worker] processing failed:', err.message);
    });
  }, intervalMs);
  timer.unref?.();
  return { started: true };
}

export function stopNotificationWorker() {
  if (!timer) return { stopped: false, reason: 'not_started' };
  clearInterval(timer);
  timer = null;
  return { stopped: true };
}

export async function processPendingNotifications({ limit = DEFAULT_BATCH_SIZE } = {}) {
  if (running) return { processed: 0, skipped: true, reason: 'already_running' };
  running = true;
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client
      .from('notification_deliveries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    let processed = 0;
    for (const row of data ?? []) {
      try {
        const message = buildNotificationTemplate(row.template, row.variables ?? {});
        const result = await deliverNotificationMessage({
          channel: row.channel,
          message,
          recipientId: row.variables?.recipientId || row.contact_id,
          priority: row.priority,
        });

        await client
          .from('notification_deliveries')
          .update({
            status: 'delivered',
            delivered_at: new Date().toISOString(),
            message_id: result.messageId,
            error_message: null,
          })
          .eq('id', row.id);
        processed += 1;
      } catch (err) {
        await client
          .from('notification_deliveries')
          .update({ status: 'failed', failed_at: new Date().toISOString(), error_message: err.message })
          .eq('id', row.id);
      }
    }

    return { processed };
  } finally {
    running = false;
  }
}
