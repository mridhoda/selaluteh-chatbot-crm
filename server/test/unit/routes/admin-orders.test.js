import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { allowedActions, mapAdminOrder } from '../../../src/routes/admin-orders.js';

describe('admin-orders route mapper', () => {
  it('falls back to joined contact phone when customer snapshot phone is missing', () => {
    const mapped = mapAdminOrder({
      id: 'order-1',
      orderNumber: 'ORD-1',
      customerSnapshot: { name: 'Test Customer' },
      customerPhoneSnapshot: null,
      contactId: {
        id: 'contact-1',
        name: 'Contact Customer',
        phone: '+628123456789',
        handle: '@customer',
        providerAccessToken: 'secret-token',
      },
    }, { role: 'admin', accessPolicy: { permissions: ['orders.manage_status'] } });

    assert.equal(mapped.customer.phone, '+628123456789');
    assert.deepEqual(mapped.contact, {
      id: 'contact-1',
      name: 'Contact Customer',
      phone: '+628123456789',
      handle: '@customer',
      telegram_id: null,
      external_id: null,
    });
    assert.equal(mapped.contact.providerAccessToken, undefined);
  });

  it('keeps customer snapshot phone ahead of contact and snapshot compatibility fallback', () => {
    const mapped = mapAdminOrder({
      id: 'order-2',
      orderNumber: 'ORD-2',
      customerSnapshot: {
        name: 'Snapshot Customer',
        phone: '+628111111111',
        phoneMasked: '+628******222',
      },
      customerPhoneSnapshot: '+628333333333',
      contact: {
        id: 'contact-2',
        phone: '+628222222222',
      },
    });

    assert.equal(mapped.customer.phone, '+628111111111');
    assert.equal(mapped.customer_phone_snapshot, '+628333333333');
    assert.equal(mapped.contact.phone, '+628222222222');
  });

  it('uses WhatsApp contact external id as customer phone when phone fields are empty', () => {
    const mapped = mapAdminOrder({
      id: 'order-3',
      orderNumber: 'ORD-3',
      channel: 'whatsapp',
      customerSnapshot: { name: 'WA Customer' },
      contactId: {
        id: 'contact-3',
        name: 'WA Customer',
        external_id: '6281234567890',
      },
    });

    assert.equal(mapped.customer.phone, '6281234567890');
    assert.equal(mapped.contact.phone, null);
    assert.equal(mapped.contact.external_id, '6281234567890');
  });

  it('does not use non-WhatsApp external id as customer phone', () => {
    const mapped = mapAdminOrder({
      id: 'order-4',
      orderNumber: 'ORD-4',
      channel: 'telegram',
      customerSnapshot: { name: 'Telegram Customer' },
      contactId: {
        id: 'contact-4',
        name: 'Telegram Customer',
        external_id: '123456789',
      },
    });

    assert.equal(mapped.customer.phone, null);
    assert.equal(mapped.contact.phone, null);
    assert.equal(mapped.contact.external_id, '123456789');
  });

  it('uses phone-like contact external id for QR/storefront orders created from chat contact', () => {
    const mapped = mapAdminOrder({
      id: 'order-5',
      orderNumber: 'ORD-5',
      channel: 'qr_store',
      customerSnapshot: { name: 'QR Customer' },
      contactId: {
        id: 'contact-5',
        name: 'QR Customer',
        external_id: '6285347731924',
      },
    });

    assert.equal(mapped.customer.phone, '6285347731924');
    assert.equal(mapped.contact.phone, null);
    assert.equal(mapped.contact.external_id, '6285347731924');
  });

  it('exposes QR scope/type context for admin order labels', () => {
    const mapped = mapAdminOrder({
      id: 'order-6',
      orderNumber: 'ORD-6',
      channel: 'qr_store',
      qrLocationLabel: 'Table A3',
      metadata: {
        qrScope: 'universal',
        qrType: 'universal',
      },
    });

    assert.equal(mapped.qr_context.location_label, 'Table A3');
    assert.equal(mapped.qr_context.qr_scope, 'universal');
    assert.equal(mapped.qr_context.qr_type, 'universal');
  });

  it('only exposes kitchen lifecycle actions for the simplified UI', () => {
    const actions = allowedActions({
      capabilities: {
        canAccept: true,
        canStartPreparing: true,
        canMarkReady: true,
        canComplete: true,
        canCancel: true,
      },
    }, { role: 'admin', accessPolicy: { permissions: ['orders.manage_status'] } });

    assert.deepEqual(actions, ['ready', 'complete', 'cancel']);
  });
});
