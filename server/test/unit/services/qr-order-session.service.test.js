import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { qrOrderSessionInternals } from '../../../src/services/qr-order-session.service.js';

describe('QR order session service', () => {
  it('keeps QR code id separate from QR order session id', () => {
    const context = qrOrderSessionInternals.buildQrStoreContextResponse({
      qrCodeRecord: {
        id: 'qr-code-1',
      },
      qrSessionRecord: null,
      contextRecord: {
      id: 'qr-code-1',
      workspaceId: 'workspace-1',
      outletId: 'outlet-1',
      outlet: { id: 'outlet-1', name: 'SELKOP Counter', status: 'active' },
      qrLocation: { id: 'qr-location-1', locationType: 'counter', label: 'Counter', defaultFulfillmentType: 'pickup' },
      expiresAt: null,
      },
      products: [],
    });

    assert.equal(context.qr_session.id, null);
    assert.equal(context.qr_session.qr_code_id, 'qr-code-1');
    assert.equal(context.qr_context.qr_location_id, 'qr-location-1');
    assert.equal(context.outlet.id, 'outlet-1');
  });

  it('returns Universal QR context without forcing an outlet before selection', () => {
    const context = qrOrderSessionInternals.buildQrStoreContextResponse({
      qrCodeRecord: { id: 'qr-code-universal' },
      qrSessionRecord: null,
      contextRecord: {
        id: 'qr-code-universal',
        workspaceId: 'workspace-1',
        outletId: null,
        scope: 'universal',
        qrType: 'universal',
        expiresAt: null,
      },
      selectableOutlets: [{ id: 'outlet-1', name: 'SELKOP A', status: 'active', metadata: { orderingEnabled: true } }],
      products: [],
    });

    assert.equal(context.qr_session.outlet_locked, false);
    assert.equal(context.qr_session.scope, 'universal');
    assert.equal(context.qr_session.qr_type, 'universal');
    assert.equal(context.outlet, null);
    assert.equal(context.outlets.length, 1);
    assert.deepEqual(context.menu.products, []);
  });

  it('returns selected outlet menu for Universal QR after outlet selection', () => {
    const context = qrOrderSessionInternals.buildQrStoreContextResponse({
      qrCodeRecord: { id: 'qr-code-universal' },
      qrSessionRecord: null,
      contextRecord: {
        id: 'qr-code-universal',
        workspaceId: 'workspace-1',
        outletId: null,
        scope: 'universal',
        qrType: 'universal',
        expiresAt: null,
      },
      selectedOutlet: { id: 'outlet-2', name: 'SELKOP B', status: 'active', metadata: { orderingEnabled: true } },
      selectableOutlets: [{ id: 'outlet-2', name: 'SELKOP B', status: 'active', metadata: { orderingEnabled: true } }],
      products: [{ id: 'prod-1', name: 'Tea', basePrice: 18000, metadata: { category: 'Tea' } }],
    });

    assert.equal(context.qr_session.outlet_locked, false);
    assert.equal(context.outlet.id, 'outlet-2');
    assert.equal(context.menu.products[0].id, 'prod-1');
  });

  it('locks outlet/location QR and carries structured location metadata', () => {
    const context = qrOrderSessionInternals.buildQrStoreContextResponse({
      qrCodeRecord: { id: 'qr-code-location' },
      qrSessionRecord: null,
      contextRecord: {
        id: 'qr-code-location',
        workspaceId: 'workspace-1',
        outletId: 'outlet-1',
        scope: 'location',
        qrType: 'location',
        outlet: { id: 'outlet-1', name: 'SELKOP Counter', status: 'active' },
        qrLocation: { id: 'qr-location-1', locationType: 'table', label: 'Table 1', defaultFulfillmentType: 'dine_in' },
        expiresAt: null,
      },
      products: [],
    });

    assert.equal(context.qr_session.outlet_locked, true);
    assert.equal(context.qr_session.scope, 'location');
    assert.equal(context.qr_context.qr_location_id, 'qr-location-1');
    assert.equal(context.qr_context.location_label, 'Table 1');
    assert.equal(context.qr_context.fulfillment_type, 'dine_in');
  });
});
