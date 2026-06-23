/**
 * notification.service.test.js — Task 17.8
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  IDENTITY_TYPES,
  buildNotificationIdempotencyKey,
  buildNotificationTemplate,
  sendNotification,
} from '../../../src/services/notification.service.js';

describe('notification.service', () => {
  describe('Constants', () => {
    it('defines notification types', () => {
      assert.ok(NOTIFICATION_TYPES.PAYMENT_LINK);
      assert.ok(NOTIFICATION_TYPES.PAYMENT_PAID);
      assert.ok(NOTIFICATION_TYPES.ORDER_READY);
      assert.ok(NOTIFICATION_TYPES.ORDER_CANCELLED);
    });

    it('defines notification channels', () => {
      assert.ok(NOTIFICATION_CHANNELS.TELEGRAM);
      assert.ok(NOTIFICATION_CHANNELS.WHATSAPP);
      assert.ok(NOTIFICATION_CHANNELS.INSTAGRAM);
    });

    it('defines identity types', () => {
      assert.ok(IDENTITY_TYPES.PAYMENT);
      assert.ok(IDENTITY_TYPES.ORDER);
      assert.ok(IDENTITY_TYPES.CONTACT);
    });
  });

  describe('buildNotificationIdempotencyKey', () => {
    it('builds correct key for payment link', () => {
      const key = buildNotificationIdempotencyKey('payment_link', 'payment', 'abc-123', 'telegram');
      assert.ok(key.startsWith('notify:payment_link:payment:abc-123:telegram'));
    });

    it('builds correct key for order ready', () => {
      const key = buildNotificationIdempotencyKey('order_ready', 'order', 'xyz-456', 'whatsapp');
      assert.ok(key.startsWith('notify:order_ready:order:xyz-456:whatsapp'));
    });

    it('builds correct key for contact welcome', () => {
      const key = buildNotificationIdempotencyKey('contact_welcome', 'contact', 'user-789', 'telegram');
      assert.ok(key.startsWith('notify:contact_welcome:contact:user-789:telegram'));
    });
  });

  describe('sendNotification', () => {
    it('validates notification type', async () => {
      await assert.rejects(
        () => sendNotification({ workspaceId: 'test', contactId: 'test', type: 'invalid_type', channel: 'telegram' }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_NOTIFICATION_TYPE');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    it('validates channel', async () => {
      await assert.rejects(
        () => sendNotification({ workspaceId: 'test', contactId: 'test', type: 'payment_link', channel: 'invalid' }),
        (err) => {
          assert.strictEqual(err.code, 'INVALID_CHANNEL');
          assert.strictEqual(err.status, 400);
          return true;
        }
      );
    });

    it('applies template variables', async () => {
      const message = buildNotificationTemplate('Total: {amount}, Item: {item}', { amount: 'Rp 50.000', item: 'Teh Manis' });
      assert.strictEqual(message, 'Total: Rp 50.000, Item: Teh Manis');
    });
  });

  describe('buildNotificationTemplate', () => {
    it('replaces missing values with empty strings', () => {
      const message = buildNotificationTemplate('Halo {name}, status {status}', { name: 'Budi' });
      assert.strictEqual(message, 'Halo Budi, status ');
    });
  });
});
