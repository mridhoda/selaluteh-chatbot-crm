import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramWebhookController } from '../../../src/controllers/telegram-webhook.controller.js';
import { hashTelegramWebhookSecret } from '../../../src/services/telegram/telegram-connection-crypto.service.js';

function makeReq({ publicId = 'tgc_testPublicId0001', secret = 'secret_A', body = { update_id: 1001, message: { message_id: 1 } } } = {}) {
  return {
    params: { connectionPublicId: publicId },
    body,
    get(name) {
      return name.toLowerCase() === 'x-telegram-bot-api-secret-token' ? secret : undefined;
    },
  };
}

function makeRes() {
  return {
    statusCode: null,
    body: null,
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('telegram webhook v1 controller', () => {
  it('resolves exact connection, verifies secret, persists event, then returns 200', async () => {
    const calls = [];
    const controller = createTelegramWebhookController({
      connectionRepository: {
        findActiveByPublicId: async (query) => {
          calls.push(['findActiveByPublicId', query]);
          return {
            id: 'conn-1',
            workspaceId: 'workspace-1',
            webhookSecretHash: hashTelegramWebhookSecret('secret_A'),
          };
        },
        recordInboundReceived: async (data) => calls.push(['recordInboundReceived', data]),
      },
      eventRepository: {
        insertOnce: async (data) => {
          calls.push(['insertOnce', data]);
          return { event: { id: 'event-1' }, duplicate: false };
        },
      },
      correlationIdFactory: () => 'corr-1',
    });

    const res = makeRes();
    await controller.handle(makeReq(), res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(calls[0], ['findActiveByPublicId', { provider: 'TELEGRAM', publicId: 'tgc_testPublicId0001' }]);
    assert.equal(calls[1][0], 'insertOnce');
    assert.equal(calls[1][1].workspaceId, 'workspace-1');
    assert.equal(calls[1][1].connectionId, 'conn-1');
    assert.equal(calls[1][1].updateId, 1001);
    assert.equal(calls[1][1].correlationId, 'corr-1');
    assert.equal(calls[2][0], 'recordInboundReceived');
  });

  it('returns 404 for unknown connection public id', async () => {
    const controller = createTelegramWebhookController({
      connectionRepository: {
        findActiveByPublicId: async () => null,
      },
      eventRepository: {},
    });

    const res = makeRes();
    await controller.handle(makeReq(), res);

    assert.equal(res.statusCode, 404);
  });

  it('returns 401 for missing or wrong secret', async () => {
    const controller = createTelegramWebhookController({
      connectionRepository: {
        findActiveByPublicId: async () => ({
          id: 'conn-1',
          workspaceId: 'workspace-1',
          webhookSecretHash: hashTelegramWebhookSecret('secret_A'),
        }),
      },
      eventRepository: {},
    });

    const res = makeRes();
    await controller.handle(makeReq({ secret: 'wrong' }), res);

    assert.equal(res.statusCode, 401);
  });
});
