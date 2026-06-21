import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInboundEvent, ValidationError } from '../../../src/ai/inbound/inbound-event.js';
import { telegramToInboundEvent } from '../../../src/ai/inbound/telegram-adapter.js';
import { whatsappToInboundEvent } from '../../../src/ai/inbound/whatsapp-adapter.js';

describe('createInboundEvent', () => {
  const valid = {
    workspaceId: 'ws-1',
    platformId: 'plat-1',
    provider: 'telegram',
    externalMessageId: '100',
    externalConversationId: '12345',
    externalUserId: '67890',
    messageType: 'text',
    text: 'Halo',
    providerTimestamp: new Date().toISOString(),
  };

  it('accepts valid Telegram event', () => {
    const event = createInboundEvent(valid);
    assert.equal(event.provider, 'telegram');
    assert.equal(event.text, 'Halo');
    assert.ok(event.correlationId);
  });

  it('accepts valid WhatsApp event', () => {
    const event = createInboundEvent({ ...valid, provider: 'whatsapp' });
    assert.equal(event.provider, 'whatsapp');
  });

  it('rejects missing required identity', () => {
    assert.throws(() => createInboundEvent({ ...valid, workspaceId: '' }), ValidationError);
    assert.throws(() => createInboundEvent({ ...valid, externalMessageId: '' }), ValidationError);
    assert.throws(() => createInboundEvent({ ...valid, externalConversationId: '' }), ValidationError);
  });

  it('rejects unknown provider', () => {
    assert.throws(() => createInboundEvent({ ...valid, provider: 'instagram' }), ValidationError);
  });

  it('rejects oversized text', () => {
    assert.throws(() => createInboundEvent({ ...valid, text: 'x'.repeat(10001) }), ValidationError);
  });

  it('rejects unsafe media metadata', () => {
    assert.throws(() => createInboundEvent({
      ...valid,
      media: { type: 'image', url: 'x', rawToken: 'secret' },
    }), ValidationError);
  });

  it('accepts null media', () => {
    const event = createInboundEvent({ ...valid, media: null });
    assert.equal(event.media, null);
  });

  it('generates correlation ID when not provided', () => {
    const event = createInboundEvent(valid);
    assert.ok(event.correlationId);
    assert.equal(typeof event.correlationId, 'string');
  });
});

describe('telegramToInboundEvent', () => {
  const baseUpdate = {
    update_id: 10001,
    message: {
      message_id: 500,
      date: 1718000000,
      chat: { id: 12345, type: 'private' },
      from: { id: 67890, first_name: 'Test', is_bot: false },
      text: 'Halo',
    },
  };

  it('converts text message to normalized event', async () => {
    const event = await telegramToInboundEvent({ update: baseUpdate, workspaceId: 'ws-1', platformId: 'plat-1' });
    assert.ok(event);
    assert.equal(event.provider, 'telegram');
    assert.equal(event.externalMessageId, '500');
    assert.equal(event.externalConversationId, '12345');
    assert.equal(event.text, 'Halo');
    assert.equal(event.messageType, 'text');
  });

  it('handles photo message with safe metadata', async () => {
    const update = {
      update_id: 10002,
      message: {
        message_id: 501,
        date: 1718000000,
        chat: { id: 12345 },
        from: { id: 67890 },
        photo: [
          { file_id: 'small', file_size: 1000 },
          { file_id: 'large', file_size: 50000 },
        ],
        caption: 'Ini foto',
      },
    };
    const event = await telegramToInboundEvent({ update, workspaceId: 'ws-1', platformId: 'plat-1' });
    assert.ok(event);
    assert.equal(event.media.type, 'image');
    assert.equal(event.media.fileId, 'large');
    assert.equal(event.text, 'Ini foto');
  });

  it('handles reply context', async () => {
    const update = {
      update_id: 10003,
      message: {
        message_id: 502,
        date: 1718000000,
        chat: { id: 12345 },
        from: { id: 67890 },
        text: 'Balasan',
        reply_to_message: { message_id: 400, text: 'Pesan asli' },
      },
    };
    const event = await telegramToInboundEvent({ update, workspaceId: 'ws-1', platformId: 'plat-1' });
    assert.ok(event);
    assert.equal(event.replyContext.externalMessageId, '400');
  });

  it('returns null for invalid update', async () => {
    const event = await telegramToInboundEvent({ update: {}, workspaceId: 'ws-1', platformId: 'plat-1' });
    assert.equal(event, null);
  });
});

describe('whatsappToInboundEvent', () => {
  const baseEntry = {
    id: 'plat-1',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: { phone_number_id: '123456' },
        contacts: [{ profile: { name: 'Test' } }],
        messages: [{
          from: '628123456789',
          id: 'wamid.ABC123',
          timestamp: '1718000000',
          type: 'text',
          text: { body: 'Halo dari WA' },
        }],
      },
    }],
  };

  it('converts text message to normalized event', async () => {
    const event = await whatsappToInboundEvent({ entry: baseEntry, workspaceId: 'ws-1', platformId: 'plat-2' });
    assert.ok(event);
    assert.equal(event.provider, 'whatsapp');
    assert.equal(event.externalMessageId, 'wamid.ABC123');
    assert.equal(event.externalConversationId, '628123456789');
    assert.equal(event.text, 'Halo dari WA');
  });

  it('handles image message with safe metadata', async () => {
    const entry = {
      ...baseEntry,
      changes: [{
        value: {
          ...baseEntry.changes[0].value,
          messages: [{
            from: '628123456789',
            id: 'wamid.IMG',
            timestamp: '1718000000',
            type: 'image',
            image: { mime_type: 'image/jpeg', id: 'media-id-1' },
            caption: 'Gambar produk',
          }],
        },
      }],
    };
    const event = await whatsappToInboundEvent({ entry, workspaceId: 'ws-1', platformId: 'plat-2' });
    assert.ok(event);
    assert.equal(event.media.type, 'image');
    assert.equal(event.media.id, 'media-id-1');
    assert.equal(event.text, 'Gambar produk');
  });

  it('returns null when no messages', async () => {
    const entry = { ...baseEntry, changes: [{ value: { metadata: {}, messages: [] } }] };
    const event = await whatsappToInboundEvent({ entry, workspaceId: 'ws-1', platformId: 'plat-2' });
    assert.equal(event, null);
  });

  it('returns null for missing message id', async () => {
    const entry = { ...baseEntry, changes: [{ value: { metadata: {}, messages: [{ from: '123' }] } }] };
    const event = await whatsappToInboundEvent({ entry, workspaceId: 'ws-1', platformId: 'plat-2' });
    assert.equal(event, null);
  });
});
