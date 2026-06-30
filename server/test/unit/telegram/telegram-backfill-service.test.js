import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramBackfillService } from '../../../src/services/telegram/telegram-backfill.service.js';

describe('telegram backfill service', () => {
  it('creates channel connections from legacy Telegram platforms with tokens', async () => {
    const calls = [];
    const service = createTelegramBackfillService({
      platformsRepository: {
        listWithCredentialsByType: async () => [{ id: 'platform-1', workspaceId: 'workspace-1', token: '123:ABC', label: 'Telegram Bot' }],
        update: async (data) => calls.push(['platform.update', data]),
      },
      connectionRepository: {
        findActiveByProviderAccountId: async () => null,
        create: async (data) => {
          calls.push(['connection.create', data]);
          return { id: 'conn-1', ...data };
        },
      },
      telegramApi: {
        getMe: async () => ({ id: 123, username: 'bot_a', first_name: 'Bot A' }),
      },
      idGenerator: () => 'tgc_backfill000001',
      secretGenerator: () => 'secret_A',
      encryptCredential: (value) => `enc:${value}`,
      keyVersion: 'v-test',
      fingerprintPepper: 'pepper',
    });

    const result = await service.backfillLegacyTelegramPlatforms();

    assert.equal(result.created, 1);
    assert.equal(calls[0][0], 'connection.create');
    assert.equal(calls[0][1].providerAccountId, '123');
    assert.equal(calls[1][0], 'platform.update');
    assert.equal(calls[1][1].updates.metadata.channelConnectionId, 'conn-1');
  });
});
