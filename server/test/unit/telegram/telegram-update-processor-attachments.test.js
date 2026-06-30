import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createTelegramUpdateProcessor } from '../../../src/services/telegram/telegram-update-processor.service.js';

function baseDeps(overrides = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      connectionRepository: { findById: async () => ({ id: 'conn-1', workspaceId: 'ws-1', provider: 'TELEGRAM', connectionStatus: 'CONNECTED', credentialCiphertext: 'enc' }) },
      contactsRepository: { upsertByChannelIdentity: async () => ({ id: 'contact-1', name: 'Budi' }) },
      chatsRepository: {
        upsertByChannelConversation: async () => ({ id: 'chat-1', workspaceId: 'ws-1', channelConnectionId: 'conn-1', providerConversationId: '123', contactId: 'contact-1' }),
        markInboundActivity: async () => {},
      },
      messagesRepository: {
        findByConnectionProviderMessage: async () => null,
        createWithConnection: async (data) => { calls.push(['message', data.content, data.attachment?.filename]); return { id: 'msg-1', ...data }; },
      },
      platformsRepository: { findByChannelConnectionId: async () => ({ id: 'platform-1' }) },
      agentsRepository: { list: async () => [] },
      outboundService: { sendTelegramConversationMessage: async (data) => calls.push(['outbound', data.text, data.replyMarkup?.inline_keyboard?.length]) },
      loadRecentMessages: async () => [{ id: 'old-ai', senderType: 'ai', direction: 'outbound', content: 'Halo' }],
      ...overrides,
    },
  };
}

describe('telegram update processor attachments and checkout', () => {
  it('stores incoming Telegram photo attachment', async () => {
    const { calls, deps } = baseDeps({
      telegramFileService: {
        saveTelegramFileLocally: async () => ({ storedName: 'photo.jpg', originalName: 'photo.jpg', url: '/public-files/photo.jpg' }),
      },
      generateAIReply: async () => '',
    });
    const processor = createTelegramUpdateProcessor(deps);

    await processor.process({ workspaceId: 'ws-1', connectionId: 'conn-1', payload: { update_id: 1, message: { message_id: 10, chat: { id: 123 }, photo: [{ file_id: 'f1', file_unique_id: 'u1' }] } } });

    assert.equal(calls[0][0], 'message');
    assert.equal(calls[0][1], '[Foto dikirim]');
    assert.equal(calls[0][2], 'photo.jpg');
  });

  it('sends checkout prompt when AI reply reports cart item added', async () => {
    const { calls, deps } = baseDeps({
      generateAIReply: async () => ({ text: 'Item sudah masuk keranjang.', cartItemAdded: true }),
      cartsRepository: { findActiveByContact: async () => ({ id: 'cart-1', outletId: 'outlet-1', items: [{ name: 'Teh' }], total: 10000, status: 'active' }) },
      checkoutsRepository: { create: async () => ({ id: 'checkout-1' }) },
    });
    const processor = createTelegramUpdateProcessor(deps);

    await processor.process({ workspaceId: 'ws-1', connectionId: 'conn-1', payload: { update_id: 2, message: { message_id: 11, text: 'tambah teh', chat: { id: 123 } } } });

    assert.ok(calls.some((call) => call[0] === 'outbound' && call[1] === 'Item sudah masuk keranjang.'));
    assert.ok(calls.some((call) => call[0] === 'outbound' && call[1].includes('checkout')));
  });
});
