import assert from 'node:assert/strict';
import { after, afterEach, before, describe, it } from 'node:test';
import WebhookEvent from '../../../src/models/WebhookEvent.js';
import {
  beginWebhookEvent,
  getMetaMessageEventId,
  getPaymentEventId,
  getTelegramEventId,
  markWebhookFailed,
  markWebhookProcessed,
} from '../../../src/services/webhook-idempotency.service.js';
import { clearTestDb, connectTestDb, disconnectTestDb, objectId } from '../../helpers/mongoMemory.js';

describe('webhook idempotency', () => {
  before(connectTestDb);
  afterEach(clearTestDb);
  after(disconnectTestDb);

  it('computes stable Telegram event ids from update_id first', () => {
    const update = {
      update_id: 12345,
      message: { message_id: 99, chat: { id: 777 }, text: 'halo' },
    };

    assert.equal(getTelegramEventId(update), 'update:12345');
  });

  it('computes stable Telegram event ids from callback id fallback', () => {
    const update = {
      callback_query: {
        id: 'callback-1',
        data: 'select_outlet:abc',
        message: { message_id: 10, chat: { id: 20 } },
      },
    };

    assert.equal(getTelegramEventId(update), 'message:20:10');
  });

  it('stores first webhook event and treats duplicate as duplicate without new row', async () => {
    const workspaceId = objectId();
    const platformId = objectId();
    const payload = { update_id: 777, message: { message_id: 1, text: 'hello' } };
    const externalEventId = getTelegramEventId(payload);

    const first = await beginWebhookEvent({
      provider: 'telegram',
      eventType: 'message',
      externalEventId,
      workspaceId,
      platformId,
      payload,
      signatureValid: true,
    });
    await markWebhookProcessed(first.event);

    const second = await beginWebhookEvent({
      provider: 'telegram',
      eventType: 'message',
      externalEventId,
      workspaceId,
      platformId,
      payload,
      signatureValid: true,
    });

    const rows = await WebhookEvent.find({ provider: 'telegram', platformId, externalEventId });
    const refreshed = await WebhookEvent.findById(first.event._id);

    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, true);
    assert.equal(rows.length, 1);
    assert.equal(refreshed.status, 'processed');
    assert.equal(refreshed.attemptCount, 2);
  });

  it('allows same external event id on different platform ids', async () => {
    const workspaceId = objectId();
    const platformA = objectId();
    const platformB = objectId();
    const externalEventId = 'update:same';

    const first = await beginWebhookEvent({
      provider: 'telegram',
      externalEventId,
      workspaceId,
      platformId: platformA,
      payload: { update_id: 'same' },
    });
    const second = await beginWebhookEvent({
      provider: 'telegram',
      externalEventId,
      workspaceId,
      platformId: platformB,
      payload: { update_id: 'same' },
    });

    assert.equal(first.duplicate, false);
    assert.equal(second.duplicate, false);
    assert.equal(await WebhookEvent.countDocuments({ provider: 'telegram', externalEventId }), 2);
  });

  it('records failed webhook processing errors', async () => {
    const result = await beginWebhookEvent({
      provider: 'meta:whatsapp',
      eventType: 'message',
      externalEventId: 'message:wa-1',
      workspaceId: objectId(),
      platformId: objectId(),
      payload: { id: 'wa-1' },
    });

    await markWebhookFailed(result.event, new Error('provider failed'));
    const event = await WebhookEvent.findById(result.event._id);

    assert.equal(event.status, 'failed');
    assert.match(event.error, /provider failed/);
    assert.ok(event.processedAt);
  });

  it('computes Meta and payment idempotency ids from provider payload identifiers', () => {
    assert.equal(getMetaMessageEventId({ id: 'wamid.1' }), 'message:wamid.1');
    assert.equal(getMetaMessageEventId({ mid: 'ig-mid-1' }), 'message:ig-mid-1');
    assert.equal(getPaymentEventId('midtrans', { transaction_id: 'trx-1' }), 'trx-1');
    assert.equal(getPaymentEventId('xendit', { event_id: 'evt-1' }), 'evt-1');
  });
});
