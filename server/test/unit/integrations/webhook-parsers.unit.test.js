import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTelegramUpdate } from '../../../src/integrations/telegram/telegram-parser.js';
import { normalizeMetaPayload } from '../../../src/integrations/meta/meta-parser.js';

describe('webhook parsers', () => {
  it('normalizes Telegram message and callback updates', () => {
    const message = normalizeTelegramUpdate({ update_id: 1, message: { message_id: 2, chat: { id: 123 }, text: '/start' } });
    assert.equal(message.eventType, 'message');
    assert.equal(message.chatId, 123);
    assert.equal(message.text, '/start');

    const callback = normalizeTelegramUpdate({ update_id: 2, callback_query: { id: 'cb1', data: 'act:prod:list', message: { chat: { id: 123 } } } });
    assert.equal(callback.eventType, 'callback_query');
    assert.equal(callback.callbackData, 'act:prod:list');
    assert.equal(callback.text, 'act:prod:list');
  });

  it('normalizes WhatsApp Meta messages', () => {
    const events = normalizeMetaPayload({
      object: 'whatsapp_business_account',
      entry: [{
        id: 'waba-1',
        changes: [{
          field: 'messages',
          value: {
            metadata: { phone_number_id: 'phone-1' },
            messages: [{ id: 'wamid.1', from: '628123', timestamp: '1', type: 'text', text: { body: 'Halo' } }],
          },
        }],
      }],
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].provider, 'meta:whatsapp');
    assert.equal(events[0].externalEventId, 'wamid.1');
    assert.equal(events[0].text, 'Halo');
  });

  it('normalizes Instagram Meta messages', () => {
    const events = normalizeMetaPayload({
      object: 'instagram',
      entry: [{
        id: 'ig-1',
        changes: [{}],
        messaging: [{ sender: { id: 'sender-1' }, timestamp: 1, message: { mid: 'mid.1', text: 'Hi' } }],
      }],
    });

    assert.equal(events.length, 1);
    assert.equal(events[0].provider, 'meta:instagram');
    assert.equal(events[0].externalEventId, 'mid.1');
    assert.equal(events[0].text, 'Hi');
  });
});
