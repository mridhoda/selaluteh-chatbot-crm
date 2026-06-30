import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { createTelegramWebhookController } from '../../src/controllers/telegram-webhook.controller.js';
import { createTelegramWebhookEventsWorker } from '../../src/workers/telegram-webhook-events.worker.js';
import { hashTelegramWebhookSecret } from '../../src/services/telegram/telegram-connection-crypto.service.js';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

describe('Telegram webhook v1 E2E route contract', () => {
  it('persists an exact-connection event and worker processes it once', async () => {
    const events = [];
    const processed = [];
    const connection = {
      id: 'conn-1',
      workspaceId: 'workspace-1',
      publicId: 'tgc_e2ePublicId00001',
      webhookSecretHash: hashTelegramWebhookSecret('secret_A'),
    };
    const eventRepository = {
      insertOnce: async (data) => {
        const event = { id: 'event-1', ...data, status: 'PENDING' };
        events.push(event);
        return { event, duplicate: false };
      },
      claimNext: async () => events.shift() || null,
      markProcessed: async (id) => processed.push(id),
      scheduleRetry: async () => {},
      moveToDeadLetter: async () => {},
    };
    const connectionRepository = {
      findActiveByPublicId: async ({ publicId }) => (publicId === connection.publicId ? connection : null),
      recordInboundReceived: async () => {},
    };

    const controller = createTelegramWebhookController({
      connectionRepository,
      eventRepository,
      correlationIdFactory: () => 'corr-e2e',
    });

    const app = express();
    app.use(express.json());
    app.post('/webhooks/telegram/v1/:connectionPublicId', (req, res) => controller.handle(req, res));
    const server = await listen(app);
    try {
      const port = server.address().port;
      const response = await fetch(`http://127.0.0.1:${port}/webhooks/telegram/v1/${connection.publicId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': 'secret_A',
        },
        body: JSON.stringify({
          update_id: 101,
          message: { message_id: 201, text: '/start', chat: { id: 123, first_name: 'Budi' } },
        }),
      });
      assert.equal(response.status, 200);

      const worker = createTelegramWebhookEventsWorker({
        eventRepository,
        processor: { process: async (event) => processed.push(`process:${event.id}`) },
      });
      assert.equal(await worker.processOnce(), true);
      assert.deepEqual(processed, ['process:event-1', 'event-1']);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
