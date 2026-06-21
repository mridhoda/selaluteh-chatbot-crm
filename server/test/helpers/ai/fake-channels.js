import crypto from 'node:crypto';

export function createFakeTelegramAdapter() {
  const sentMessages = [];

  return {
    verifyWebhook: async (input) => ({
      verified: true,
      provider: 'telegram',
      raw: input,
    }),

    parseInbound: async (input) => [{
      workspaceId: input.workspaceId || 'test-ws',
      platformId: input.platformId || 'test-platform',
      provider: 'telegram',
      externalMessageId: String(input.message?.message_id || Math.floor(Math.random() * 10000000)),
      externalConversationId: String(input.message?.chat?.id || Math.floor(Math.random() * 10000000)),
      externalUserId: String(input.message?.from?.id || Math.floor(Math.random() * 10000000)),
      messageType: 'text',
      text: input.message?.text || 'Test message',
      media: null,
      providerTimestamp: new Date().toISOString(),
      correlationId: crypto.randomUUID(),
    }],

    sendText: async (input) => {
      sentMessages.push({ type: 'text', ...input });
      return { success: true, providerMessageId: String(Math.floor(Math.random() * 10000000)) };
    },

    sendButtons: async (input) => {
      sentMessages.push({ type: 'buttons', ...input });
      return { success: true, providerMessageId: String(Math.floor(Math.random() * 10000000)) };
    },

    sendMedia: async (input) => {
      sentMessages.push({ type: 'media', ...input });
      return { success: true, providerMessageId: String(Math.floor(Math.random() * 10000000)) };
    },

    sendTyping: async () => {},

    getSentMessages: () => [...sentMessages],
    reset: () => { sentMessages.length = 0; },
  };
}

export function createFakeWhatsAppAdapter() {
  const sentMessages = [];

  return {
    verifyWebhook: async (input) => ({
      verified: true,
      provider: 'whatsapp',
      raw: input,
    }),

    parseInbound: async (input) => [{
      workspaceId: input.workspaceId || 'test-ws',
      platformId: input.platformId || 'test-platform',
      provider: 'whatsapp',
      externalMessageId: input.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id || `wa-${Math.random().toString(36).slice(2)}`,
      externalConversationId: input.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || `wa-conv-${Math.random().toString(36).slice(2)}`,
      externalUserId: input.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || `wa-user-${Math.random().toString(36).slice(2)}`,
      messageType: 'text',
      text: input.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || 'Test WhatsApp message',
      media: null,
      providerTimestamp: new Date().toISOString(),
      correlationId: crypto.randomUUID(),
    }],

    sendText: async (input) => {
      sentMessages.push({ type: 'text', ...input });
      return { success: true, providerMessageId: `wa-${crypto.randomUUID().slice(0, 16)}` };
    },

    sendButtons: async (input) => {
      sentMessages.push({ type: 'buttons', ...input });
      return { success: true, providerMessageId: `wa-${crypto.randomUUID().slice(0, 16)}` };
    },

    sendMedia: async (input) => {
      sentMessages.push({ type: 'media', ...input });
      return { success: true, providerMessageId: `wa-${crypto.randomUUID().slice(0, 16)}` };
    },

    sendTyping: async () => {},

    getSentMessages: () => [...sentMessages],
    reset: () => { sentMessages.length = 0; },
  };
}
