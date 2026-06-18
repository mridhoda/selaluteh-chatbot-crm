import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getTelegramEventId, getMetaMessageEventId, hashPayload } from '../../../src/services/webhook-idempotency.service.js';


describe('message idempotency', () => {
  it('derives Telegram event id from update id first', () => {
    assert.equal(getTelegramEventId({ update_id: 123, message: { message_id: 9 } }), 'update:123');
  });

  it('derives Telegram message id when update id is absent', () => {
    assert.equal(getTelegramEventId({ message: { message_id: 9, chat: { id: 7 } } }), 'message:7:9');
  });

  it('derives Meta message id from id or mid', () => {
    assert.equal(getMetaMessageEventId({ id: 'wamid-1' }), 'message:wamid-1');
    assert.equal(getMetaMessageEventId({ mid: 'igmid-1' }), 'message:igmid-1');
  });

  it('hashes payload deterministically', () => {
    assert.equal(hashPayload({ a: 1 }), hashPayload({ a: 1 }));
    assert.notEqual(hashPayload({ a: 1 }), hashPayload({ a: 2 }));
  });
});
