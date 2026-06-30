import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramConnectionService } from '../../../src/services/telegram/telegram-connection.service.js';

describe('telegram connection service', () => {
  it('validates bot identity, creates connection, registers webhook, and marks connected', async () => {
    const calls = [];
    const connectionRepository = {
      findActiveByProviderAccountId: async () => null,
      create: async (data) => {
        calls.push(['create', data]);
        return { id: 'conn-1', ...data };
      },
      markConnected: async (data) => {
        calls.push(['markConnected', data]);
        return { id: data.connectionId, connectionStatus: 'CONNECTED', webhookStatus: 'VERIFIED' };
      },
      markError: async (data) => {
        calls.push(['markError', data]);
      },
    };
    const telegramApi = {
      getMe: async (token) => {
        calls.push(['getMe', token]);
        return { id: 12345, username: 'selaluteh_bot', first_name: 'SelaluTeh' };
      },
      setWebhook: async (token, payload) => {
        calls.push(['setWebhook', token, payload]);
        return { ok: true };
      },
      getWebhookInfo: async () => ({ url: 'https://crm.test/webhooks/telegram/v1/tgc_testPublicId0001' }),
    };

    const service = createTelegramConnectionService({
      connectionRepository,
      telegramApi,
      idGenerator: () => 'tgc_testPublicId0001',
      secretGenerator: () => 'secret_A',
      encryptCredential: (value) => `enc:${value}`,
      keyVersion: 'v-test',
      fingerprintPepper: 'pepper',
    });

    const result = await service.connectTelegramBot({
      workspaceId: 'workspace-1',
      actorUserId: 'user-1',
      botToken: '12345:token',
      publicBaseUrl: 'https://crm.test',
    });

    assert.equal(result.connectionStatus, 'CONNECTED');
    assert.equal(result.webhookStatus, 'VERIFIED');
    assert.equal(calls[0][0], 'getMe');
    assert.equal(calls[1][0], 'create');
    assert.equal(calls[1][1].provider, 'TELEGRAM');
    assert.equal(calls[1][1].providerAccountId, '12345');
    assert.equal(calls[1][1].providerUsername, 'selaluteh_bot');
    assert.equal(calls[1][1].credentialCiphertext, 'enc:12345:token');
    assert.equal(calls[1][1].webhookSecretCiphertext, 'enc:secret_A');
    assert.equal(calls[2][0], 'setWebhook');
    assert.equal(calls[2][2].url, 'https://crm.test/webhooks/telegram/v1/tgc_testPublicId0001');
    assert.equal(calls[2][2].secret_token, 'secret_A');
    assert.equal(calls[3][0], 'markConnected');
  });

  it('rejects duplicate active bot in another workspace', async () => {
    const service = createTelegramConnectionService({
      connectionRepository: {
        findActiveByProviderAccountId: async () => ({ id: 'existing', workspaceId: 'other-workspace' }),
      },
      telegramApi: {
        getMe: async () => ({ id: 12345, username: 'duplicate_bot', first_name: 'Duplicate' }),
      },
    });

    await assert.rejects(
      () => service.connectTelegramBot({
        workspaceId: 'workspace-1',
        actorUserId: 'user-1',
        botToken: '12345:token',
        publicBaseUrl: 'https://crm.test',
      }),
      (err) => err.code === 'TELEGRAM_BOT_ALREADY_CONNECTED',
    );
  });
});
