import crypto from 'node:crypto';
import { channelConnectionsRepository, telegramWebhookEventsRepository } from '../db/repositories/index.js';
import { assertWebhookPayloadSafe } from '../security/webhook-security.js';
import { verifyTelegramWebhookSecret } from '../services/telegram/telegram-connection-crypto.service.js';
import { isValidTelegramConnectionPublicId } from '../services/telegram/telegram-connection-id.service.js';
import { normalizeTelegramUpdate } from '../integrations/telegram/telegram-parser.js';

function detectTelegramUpdateType(update = {}, normalized = {}) {
  if (normalized.eventType) return normalized.eventType;
  if (update.callback_query) return 'callback_query';
  if (update.message) return 'message';
  if (update.edited_message) return 'edited_message';
  return 'unknown';
}

function createCorrelationId() {
  return `tg_${crypto.randomUUID()}`;
}

export function createTelegramWebhookController({
  connectionRepository = channelConnectionsRepository,
  eventRepository = telegramWebhookEventsRepository,
  correlationIdFactory = createCorrelationId,
} = {}) {
  async function handle(req, res) {
    try {
      const publicId = req.params?.connectionPublicId || '';
      if (!isValidTelegramConnectionPublicId(publicId)) return res.sendStatus(404);

      const connection = await connectionRepository.findActiveByPublicId({ provider: 'TELEGRAM', publicId });
      if (!connection) return res.sendStatus(404);

      const receivedSecret = req.get('x-telegram-bot-api-secret-token');
      if (!verifyTelegramWebhookSecret({ receivedSecret, storedHash: connection.webhookSecretHash })) {
        return res.sendStatus(401);
      }

      const update = req.body || {};
      assertWebhookPayloadSafe(update);
      if (update.update_id === undefined || update.update_id === null) {
        return res.status(400).json({ error: { code: 'TELEGRAM_WEBHOOK_PAYLOAD_INVALID', message: 'Missing update_id' } });
      }

      const normalized = normalizeTelegramUpdate(update);
      const result = await eventRepository.insertOnce({
        workspaceId: connection.workspaceId,
        connectionId: connection.id,
        updateId: update.update_id,
        updateType: detectTelegramUpdateType(update, normalized),
        payload: update,
        correlationId: correlationIdFactory(),
      });

      if (!result?.duplicate) {
        await connectionRepository.recordInboundReceived?.({ workspaceId: connection.workspaceId, connectionId: connection.id });
      }

      return res.sendStatus(200);
    } catch (error) {
      console.error('[telegram-webhook-v1] error:', error?.code || error?.message || error);
      return res.status(500).json({ error: { code: 'TELEGRAM_WEBHOOK_EVENT_PERSIST_FAILED', message: 'Failed to persist Telegram webhook event' } });
    }
  }

  return { handle };
}

export const telegramWebhookController = createTelegramWebhookController();
