import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramUpdateProcessor } from '../../../src/services/telegram/telegram-update-processor.service.js';

describe('telegram update processor', () => {
  it('processes inbound update through exact connection and sends welcome outbound', async () => {
    const calls = [];
    const processor = createTelegramUpdateProcessor({
      connectionRepository: {
        findById: async () => ({
          id: 'conn-1',
          workspaceId: 'workspace-1',
          provider: 'TELEGRAM',
          connectionStatus: 'CONNECTED',
          credentialCiphertext: 'enc-token',
          credentialKeyVersion: 'v1',
        }),
      },
      contactsRepository: {
        upsertByChannelIdentity: async (data) => {
          calls.push(['contact', data.channelConnectionId, data.providerUserId]);
          return { id: 'contact-1', name: data.data.name };
        },
      },
      chatsRepository: {
        upsertByChannelConversation: async (data) => {
          calls.push(['chat', data.channelConnectionId, data.providerConversationId]);
          return {
            id: 'chat-1',
            workspaceId: data.workspaceId,
            channelConnectionId: data.channelConnectionId,
            providerConversationId: data.providerConversationId,
            contactId: data.contactId,
            channelConnections: {
              id: data.channelConnectionId,
              provider: 'TELEGRAM',
              connectionStatus: 'CONNECTED',
              credentialCiphertext: 'enc-token',
              credentialKeyVersion: 'v1',
            },
            contacts: { id: data.contactId, externalId: '123456' },
          };
        },
        markInboundActivity: async (chatId) => calls.push(['markInbound', chatId]),
      },
      messagesRepository: {
        findByConnectionProviderMessage: async () => null,
        createWithConnection: async (data) => {
          calls.push(['message', data.direction, data.channelConnectionId, data.providerMessageId]);
          return { id: data.direction === 'inbound' ? 'msg-in' : 'msg-out', ...data };
        },
      },
      platformsRepository: {
        findByChannelConnectionId: async () => ({ id: 'platform-1' }),
      },
      agentsRepository: {
        list: async () => [{ id: 'agent-1', welcomeMessage: 'Halo {{name}}' }],
      },
      outboundService: {
        sendTelegramConversationMessage: async (data) => {
          calls.push(['outbound', data.chatId, data.text]);
          return { providerMessageId: '9001' };
        },
      },
      loadRecentMessages: async () => [],
    });

    await processor.process({
      id: 'event-1',
      workspaceId: 'workspace-1',
      connectionId: 'conn-1',
      payload: {
        update_id: 77,
        message: {
          message_id: 101,
          text: '/start',
          chat: { id: 123456, first_name: 'Budi', username: 'budi' },
        },
      },
    });

    assert.deepEqual(calls[0], ['contact', 'conn-1', '123456']);
    assert.deepEqual(calls[1], ['chat', 'conn-1', '123456']);
    assert.deepEqual(calls[2], ['message', 'inbound', 'conn-1', '101']);
    assert.deepEqual(calls[3], ['markInbound', 'chat-1']);
    assert.deepEqual(calls[4], ['outbound', 'chat-1', 'Halo Budi']);
  });
});
