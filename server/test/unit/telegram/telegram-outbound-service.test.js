import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramOutboundService } from '../../../src/services/telegram/telegram-outbound.service.js';

describe('telegram outbound service', () => {
  it('sends through the exact chat channel connection token', async () => {
    const calls = [];
    const service = createTelegramOutboundService({
      chatsRepository: {
        findByIdWithConnectionAndContact: async ({ workspaceId, chatId }) => ({
          id: chatId,
          workspaceId,
          channelConnectionId: 'conn-1',
          providerConversationId: 'tg-chat-1',
          contacts: { id: 'contact-1' },
          channelConnections: { id: 'conn-1', provider: 'TELEGRAM', credentialCiphertext: 'enc-token', credentialKeyVersion: 'v1', connectionStatus: 'CONNECTED' },
        }),
      },
      messagesRepository: {
        createWithConnection: async (data) => {
          calls.push(['createWithConnection', data]);
          return { id: 'msg-1', ...data };
        },
        updatePlatformMessageId: async (messageId, platformMessageId) => calls.push(['updatePlatformMessageId', messageId, platformMessageId]),
      },
      connectionRepository: {
        recordOutboundSuccess: async (data) => calls.push(['recordOutboundSuccess', data]),
      },
      decryptCredential: () => 'bot-token-A',
      sender: async (token, chatId, text) => {
        calls.push(['send', token, chatId, text]);
        return { ok: true, result: { message_id: 999 } };
      },
    });

    const result = await service.sendTelegramConversationMessage({
      workspaceId: 'workspace-1',
      chatId: 'chat-1',
      text: 'hello',
      senderType: 'human',
      userId: 'user-1',
    });

    assert.equal(result.providerMessageId, '999');
    assert.deepEqual(calls[0], ['send', 'bot-token-A', 'tg-chat-1', 'hello']);
    assert.equal(calls[1][0], 'createWithConnection');
    assert.equal(calls[1][1].channelConnectionId, 'conn-1');
    assert.equal(calls[1][1].providerMessageId, '999');
    assert.equal(calls[2][0], 'recordOutboundSuccess');
  });

  it('passes reply markup to Telegram sender', async () => {
    const calls = [];
    const service = createTelegramOutboundService({
      chatsRepository: {
        findByIdWithConnectionAndContact: async () => ({
          id: 'chat-1', workspaceId: 'workspace-1', channelConnectionId: 'conn-1', providerConversationId: 'tg-chat-1',
          channelConnections: { id: 'conn-1', provider: 'TELEGRAM', credentialCiphertext: 'enc-token', credentialKeyVersion: 'v1', connectionStatus: 'CONNECTED' },
        }),
      },
      messagesRepository: { createWithConnection: async (data) => data },
      connectionRepository: { recordOutboundSuccess: async () => {} },
      decryptCredential: () => 'bot-token-A',
      sender: async (token, chatId, text, replyTo, options) => {
        calls.push(options.replyMarkup.inline_keyboard[0][0].text);
        return { ok: true, result: { message_id: 1 } };
      },
    });

    await service.sendTelegramConversationMessage({
      workspaceId: 'workspace-1', chatId: 'chat-1', text: 'menu', replyMarkup: { inline_keyboard: [[{ text: 'Checkout' }]] },
    });

    assert.deepEqual(calls, ['Checkout']);
  });

  it('falls back to document send for sticker attachments with relative URLs', async () => {
    const calls = [];
    const service = createTelegramOutboundService({
      chatsRepository: {
        findByIdWithConnectionAndContact: async () => ({
          id: 'chat-1',
          workspaceId: 'workspace-1',
          contactId: 'contact-1',
          channelConnections: {
            id: 'conn-1',
            provider: 'TELEGRAM',
            connectionStatus: 'CONNECTED',
            credentialCiphertext: 'enc-token',
          },
          providerConversationId: '123',
        }),
      },
      messagesRepository: { createWithConnection: async (data) => data },
      connectionRepository: { recordOutboundSuccess: async () => {} },
      decryptCredential: () => 'bot-token',
      documentSender: async (token, chatId, filePath) => { calls.push(['document', token, chatId, filePath]); return { result: { message_id: 44 } }; },
      stickerSender: async () => { throw new Error('sticker should not be called'); },
    });

    await service.sendTelegramConversationMessage({
      workspaceId: 'workspace-1',
      chatId: 'chat-1',
      text: 'sticker',
      attachment: { format: 'sticker', type: 'document', url: '/files/sticker.webp', localFilePath: '/tmp/sticker.webp' },
    });

    assert.deepEqual(calls[0], ['document', 'bot-token', '123', '/tmp/sticker.webp']);
  });

  it('does not fallback when chat has no channel connection', async () => {
    const service = createTelegramOutboundService({
      chatsRepository: {
        findByIdWithConnectionAndContact: async () => ({ id: 'chat-1', workspaceId: 'workspace-1' }),
      },
    });

    await assert.rejects(
      () => service.sendTelegramConversationMessage({ workspaceId: 'workspace-1', chatId: 'chat-1', text: 'hello' }),
      (err) => err.code === 'TELEGRAM_CONNECTION_NOT_FOUND',
    );
  });
});
