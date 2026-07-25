import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { publicStorefrontInternals } from '../../../src/services/public-storefront.service.js';
import {
  createPublicCheckout,
  loginPublicStoreCustomer,
  registerPublicStoreCustomer,
} from '../../../src/services/public-storefront.service.js';
import { getPublicOrderByToken } from '../../../src/services/public-order.service.js';
import { publicOrderInternals } from '../../../src/services/public-order.service.js';
import {
  contactsRepository,
  ordersRepository,
  storefrontsRepository,
  workspacesRepository,
} from '../../../src/db/repositories/index.js';

describe('public storefront helpers', () => {
  it('registers an online-store customer and returns only safe profile fields', async (t) => {
    t.mock.method(storefrontsRepository, 'findActiveBySlug', async () => ({
      id: 'storefront-1',
      slug: 'selalu-kopi',
      workspaceId: 'workspace-1',
      orderingEnabled: true,
    }));
    t.mock.method(workspacesRepository, 'findById', async () => ({ id: 'workspace-1', status: 'active' }));
    t.mock.method(workspacesRepository, 'getSettings', async () => null);
    t.mock.method(contactsRepository, 'upsertPublicStoreCustomer', async (payload) => {
      assert.deepEqual(payload, {
        workspaceId: 'workspace-1',
        name: 'Lori',
        phone: '628123456789',
        email: 'lori@example.com',
        password: 'rahasia-123',
        storefrontSlug: 'selalu-kopi',
      });
      return {
        id: 'contact-1',
        name: 'Lori',
        phone: '628123456789',
        email: 'lori@example.com',
        tags: ['online_store', 'demo_customer'],
        metadata: { demo_password: 'rahasia-123' },
      };
    });

    const response = await registerPublicStoreCustomer({
      storefrontSlug: 'selalu-kopi',
      name: 'Lori',
      phone: '628123456789',
      email: 'Lori@Example.com',
      password: 'rahasia-123',
    });

    assert.deepEqual(response.customer, {
      id: 'contact-1',
      name: 'Lori',
      phone: '628123456789',
      email: 'lori@example.com',
      tags: ['online_store', 'demo_customer'],
    });
    assert.equal(JSON.stringify(response).includes('rahasia-123'), false);
  });

  it('rejects incomplete online-store registration before touching the repository', async () => {
    await assert.rejects(
      () => registerPublicStoreCustomer({ storefrontSlug: 'selalu-kopi', name: 'Lori', phone: '628123456789', email: '', password: 'secret' }),
      (error) => error.code === 'CUSTOMER_EMAIL_REQUIRED' && error.status === 400,
    );
    await assert.rejects(
      () => registerPublicStoreCustomer({ storefrontSlug: 'selalu-kopi', name: 'Lori', phone: '628123456789', email: 'lori@example.com', password: '' }),
      (error) => error.code === 'CUSTOMER_PASSWORD_REQUIRED' && error.status === 400,
    );
  });

  it('allows the newly registered online-store customer to log in', async (t) => {
    t.mock.method(storefrontsRepository, 'findActiveBySlug', async () => ({
      id: 'storefront-1',
      slug: 'selalu-kopi',
      workspaceId: 'workspace-1',
      orderingEnabled: true,
    }));
    t.mock.method(workspacesRepository, 'findById', async () => ({ id: 'workspace-1', status: 'active' }));
    t.mock.method(workspacesRepository, 'getSettings', async () => null);
    t.mock.method(contactsRepository, 'findPublicStoreCustomerByEmail', async () => ({
      id: 'contact-1',
      name: 'Lori',
      phone: '628123456789',
      email: 'lori@example.com',
      tags: ['online_store'],
      metadata: { demo_password: 'rahasia-123' },
    }));

    const response = await loginPublicStoreCustomer({
      storefrontSlug: 'selalu-kopi',
      email: 'Lori@Example.com',
      password: 'rahasia-123',
    });

    assert.equal(response.customer.id, 'contact-1');
    assert.equal(response.customer.email, 'lori@example.com');
  });

  it('hashes idempotency payloads deterministically', () => {
    const payload = { outletId: 'outlet-1', items: [{ product_id: 'prod-1', quantity: 2 }] };
    assert.equal(publicStorefrontInternals.stableHash(payload), publicStorefrontInternals.stableHash(payload));
    assert.notEqual(publicStorefrontInternals.stableHash(payload), publicStorefrontInternals.stableHash({ ...payload, outletId: 'outlet-2' }));
  });

  it('maps public products without internal price/cost fields', () => {
    const product = publicStorefrontInternals.toPublicProduct({
      id: 'prod-1',
      name: 'Salty Caramel',
      shortDescription: 'Tea',
      basePrice: 21000,
      costPrice: 9000,
      currency: 'IDR',
      outletAvailability: { priceOverride: 22000 },
      metadata: { category: 'Signature' },
    });
    assert.equal(product.unit_price, 22000);
    assert.equal(product.category, 'Signature');
    assert.equal(Object.hasOwn(product, 'costPrice'), false);
    assert.equal(Object.hasOwn(product, 'stockQuantity'), false);
  });

  it('maps only customer-safe modifier groups and price deltas', () => {
    const product = publicStorefrontInternals.toPublicProduct({
      id: 'prod-1',
      name: 'Tea',
      basePrice: 20000,
      metadata: {
        modifiers: [{
          id: 'sugar',
          name: 'Sugar',
          min: 1,
          max: 1,
          options: [
            { id: 'normal', name: 'Normal', priceDelta: 0, internalCost: 100 },
            { id: 'less', name: 'Less Sugar', priceDelta: 1000 },
          ],
        }],
      },
      outletAvailability: { status: 'active', isAvailable: true },
    });

    assert.deepEqual(product.modifiers, [{
      id: 'sugar',
      name: 'Sugar',
      min_selections: 1,
      max_selections: 1,
      required: false,
      options: [
        { id: 'normal', name: 'Normal', price_delta: 0 },
        { id: 'less', name: 'Less Sugar', price_delta: 1000 },
      ],
    }]);
    assert.equal(JSON.stringify(product).includes('internalCost'), false);
  });

  it('maps unavailable products to a safe public availability state', () => {
    const product = publicStorefrontInternals.toPublicProduct({
      id: 'prod-2',
      name: 'Seasonal Tea',
      basePrice: 18000,
      isActive: true,
      stockQuantity: 0,
      outletAvailability: { status: 'inactive', isAvailable: false, soldOutReason: 'internal note' },
      metadata: { inventoryPolicy: 'internal' },
    });

    assert.equal(product.availability, 'unavailable');
    assert.equal(Object.hasOwn(product, 'stockQuantity'), false);
    assert.equal(Object.hasOwn(product, 'soldOutReason'), false);
    assert.equal(JSON.stringify(product).includes('inventoryPolicy'), false);
  });

  it('builds an empty cart snapshot with backend-owned total fields', () => {
    assert.deepEqual(publicStorefrontInternals.emptyCartSnapshot(), {
      currency: 'IDR',
      subtotal_amount: 0,
      discount_amount: 0,
      service_fee_amount: 0,
      tax_amount: 0,
      total_amount: 0,
      items: [],
    });
  });

  it('maps storefront outlet flags without enabling dine-in by default', () => {
    const outlet = publicStorefrontInternals.toPublicOutlet({
      id: 'outlet-1',
      name: 'SELKOP Samarinda',
      status: 'active',
      metadata: { orderingEnabled: true, pickupEnabled: true },
    });

    assert.equal(outlet.ordering_enabled, true);
    assert.equal(outlet.pickup_enabled, true);
    assert.equal(outlet.dine_in_enabled, false);
    assert.equal(outlet.takeaway_enabled, false);

    const mapped = publicStorefrontInternals.toPublicOutlet({
      id: 'outlet-2',
      name: 'SELKOP Tenggarong',
      status: 'active',
      metadata: { orderingEnabled: true, pickupEnabled: true },
    }, { orderingEnabled: false, pickupEnabled: false, dineInEnabled: true, takeawayEnabled: true });

    assert.equal(mapped.ordering_enabled, false);
    assert.equal(mapped.pickup_enabled, false);
    assert.equal(mapped.dine_in_enabled, true);
    assert.equal(mapped.takeaway_enabled, true);
  });

  it('exposes only valid public outlet coordinates for distance recommendations', () => {
    const mapped = publicStorefrontInternals.toPublicOutlet({
      id: 'outlet-location',
      name: 'SELKOP Lokasi',
      status: 'active',
      metadata: { latitude: '-0.501', longitude: '117.153' },
    });
    assert.equal(mapped.latitude, -0.501);
    assert.equal(mapped.longitude, 117.153);

    const invalid = publicStorefrontInternals.toPublicOutlet({
      id: 'outlet-invalid-location',
      name: 'SELKOP Tanpa Lokasi',
      status: 'active',
      metadata: { latitude: 'unknown', longitude: null },
    });
    assert.equal(Object.hasOwn(invalid, 'latitude'), false);
    assert.equal(Object.hasOwn(invalid, 'longitude'), false);
  });

  it('treats only active visible orderable pickup outlets as selectable', () => {
    assert.equal(publicStorefrontInternals.isOutletOrderable({
      id: 'outlet-1',
      status: 'active',
      storefrontOutlet: { isVisible: true, orderingEnabled: true, pickupEnabled: true },
    }), true);
    assert.equal(publicStorefrontInternals.isOutletOrderable({
      id: 'outlet-2',
      status: 'inactive',
      storefrontOutlet: { isVisible: true, orderingEnabled: true, pickupEnabled: true },
    }), false);
    assert.equal(publicStorefrontInternals.isOutletOrderable({
      id: 'outlet-3',
      status: 'active',
      storefrontOutlet: { isVisible: false, orderingEnabled: true, pickupEnabled: true },
    }), false);
    assert.equal(publicStorefrontInternals.isOutletOrderable({
      id: 'outlet-4',
      status: 'active',
      storefrontOutlet: { isVisible: true, orderingEnabled: false, pickupEnabled: true },
    }), false);
  });

  it('validates modifier ownership, min/max, and uses backend price deltas', () => {
    const product = {
      id: 'prod-1',
      name: 'Tea',
      unit_price: 20000,
      modifiers: [{
        id: 'milk',
        name: 'Milk',
        min_selections: 1,
        max_selections: 1,
        options: [
          { id: 'oat', name: 'Oat Milk', price_delta: 4000 },
          { id: 'almond', name: 'Almond Milk', price_delta: 5000 },
        ],
      }],
    };

    const valid = publicStorefrontInternals.validateAndPriceModifiers({
      product,
      modifiers: [{ modifier_group_id: 'milk', option_id: 'oat', price_delta: -999999, option_name: 'Tampered' }],
    });
    assert.equal(valid.errors.length, 0);
    assert.equal(valid.totalPriceDelta, 4000);
    assert.deepEqual(valid.modifiers, [{
      modifier_group_id: 'milk',
      option_id: 'oat',
      name: 'Milk',
      option_name: 'Oat Milk',
      price_delta: 4000,
    }]);

    const invalidGroup = publicStorefrontInternals.validateAndPriceModifiers({
      product,
      modifiers: [{ modifier_group_id: 'size', option_id: 'large' }],
    });
    assert.equal(invalidGroup.errors.some((error) => error.code === 'INVALID_MODIFIER_GROUP'), true);

    const invalidOption = publicStorefrontInternals.validateAndPriceModifiers({
      product,
      modifiers: [{ modifier_group_id: 'milk', option_id: 'soy' }],
    });
    assert.equal(invalidOption.errors.some((error) => error.code === 'INVALID_MODIFIER_OPTION'), true);

    const tooMany = publicStorefrontInternals.validateAndPriceModifiers({
      product,
      modifiers: [
        { modifier_group_id: 'milk', option_id: 'oat' },
        { modifier_group_id: 'milk', option_id: 'almond' },
      ],
    });
    assert.equal(tooMany.errors.some((error) => error.code === 'MODIFIER_MAX_SELECTIONS'), true);

    const tooFew = publicStorefrontInternals.validateAndPriceModifiers({ product, modifiers: [] });
    assert.equal(tooFew.errors.some((error) => error.code === 'MODIFIER_MIN_SELECTIONS'), true);
  });

  it('keeps internal storefront context out of enumerable public response fields', () => {
    const response = { storefront: { id: 'workspace-1' }, outlets: [], menu: {} };
    Object.defineProperty(response, 'internal', {
      value: { storefrontId: 'storefront-1', workspaceId: 'workspace-1' },
      enumerable: false,
    });

    assert.equal(response.internal.storefrontId, 'storefront-1');
    assert.equal(Object.keys(response).includes('internal'), false);
    assert.equal(JSON.stringify(response).includes('storefront-1'), false);
  });

  it('builds checkout metadata from internal storefront and QR context without exposing QR code as session id', () => {
    const checkout = publicStorefrontInternals.toCheckoutLikePayload({
      idempotencyKey: 'idem-1',
      channel: 'qr_store',
      customer: { name: 'Ayu', phone: '628123' },
      customerNote: 'Less ice',
      validation: {
        context: {
          outletId: 'outlet-1',
          outlet: { name: 'SELKOP' },
          storefront: { internal: { storefrontId: 'storefront-1' } },
          qrContext: {
            qr_session: { id: null, qr_code_id: 'qr-code-1' },
            qr_context: { qr_location_id: 'qr-location-1', location_label: 'Counter' },
          },
        },
        cart_snapshot: {
          currency: 'IDR',
          subtotal_amount: 22000,
          total_amount: 22000,
          items: [{ product_id: 'prod-1', product_name: 'Tea', unit_price: 22000, quantity: 1, line_total: 22000, modifiers: [], note: null }],
        },
      },
    });

    assert.equal(checkout.qrSessionId, null);
    assert.equal(checkout.metadata.publicStorefrontId, 'storefront-1');
    assert.equal(checkout.metadata.qrCodeId, 'qr-code-1');
    assert.equal(checkout.qrLocationId, 'qr-location-1');
    assert.equal(checkout.tableId, null);
    assert.equal(checkout.metadata.qrLocation.id, 'qr-location-1');
    assert.equal(checkout.fulfillmentSnapshot.qrLocation.label, 'Counter');
    assert.equal(checkout.metadata.idempotencyKey, 'idem-1');
  });

  it('masks public order phone numbers', () => {
    assert.equal(publicOrderInternals.maskPhone('6281234567890'), '62********890');
    assert.equal(publicOrderInternals.maskPhone('1234'), '****');
    assert.equal(publicOrderInternals.maskPhone(''), null);
  });

  it('returns random public order token misses as not found', async (t) => {
    t.mock.method(ordersRepository, 'findByPublicOrderToken', async ({ token }) => {
      assert.equal(token, 'po_random_not_found');
      return null;
    });

    await assert.rejects(
      () => getPublicOrderByToken('po_random_not_found'),
      (err) => err.code === 'PUBLIC_ORDER_NOT_FOUND' && err.status === 404,
    );
  });

  it('keeps forbidden fields out of public order responses', async (t) => {
    t.mock.method(ordersRepository, 'findByPublicOrderToken', async () => ({
      id: 'internal-order-id',
      orderNumber: 'SLTH-1',
      publicOrderToken: 'po_safe',
      channel: 'online_store',
      paymentStatus: 'pending',
      fulfillmentStatus: 'not_started',
      fulfillmentType: 'pickup',
      customerSnapshot: { name: 'Ayu', phone: '6281234567890' },
      subtotalAmount: 25000,
      totalAmount: 25000,
      currency: 'IDR',
      metadata: { raw_provider_payload: { secret: 'hidden' } },
      audit_logs: [{ action: 'order.created' }],
      paymentEvents: [{ raw: { secret: 'hidden' } }],
      items: [{ productNameSnapshot: 'Tea', quantity: 1, subtotalAmount: 25000, metadata: {} }],
    }));

    const response = await getPublicOrderByToken('po_safe');
    const json = JSON.stringify(response);
    assert.equal(Object.hasOwn(response, 'id'), false);
    assert.equal(json.includes('internal-order-id'), false);
    assert.equal(json.includes('raw_provider_payload'), false);
    assert.equal(json.includes('audit_logs'), false);
    assert.equal(json.includes('6281234567890'), false);
    assert.equal(response.customer.phone, '62********890');
    assert.deepEqual(response.amounts, {
      subtotal_amount: 25000,
      discount_amount: 0,
      service_fee_amount: 0,
      tax_amount: 0,
      total_amount: 25000,
      currency: 'IDR',
    });
  });

  it('requires customer name and phone before public checkout side effects', async () => {
    await assert.rejects(
      () => createPublicCheckout({ body: { customer: { name: 'Ayu', phone: '628123' } } }),
      (err) => err.code === 'IDEMPOTENCY_KEY_REQUIRED' && err.status === 400,
    );
    await assert.rejects(
      () => createPublicCheckout({ idempotencyKey: 'idem-1', body: { customer: { phone: '628123' } } }),
      (err) => err.code === 'CUSTOMER_NAME_REQUIRED' && err.status === 400,
    );
    await assert.rejects(
      () => createPublicCheckout({ idempotencyKey: 'idem-2', body: { customer: { name: 'Ayu' } } }),
      (err) => err.code === 'CUSTOMER_PHONE_REQUIRED' && err.status === 400,
    );
  });

  it('rejects same idempotency key with a different checkout hash', async () => {
    await assert.rejects(
      () => publicStorefrontInternals.resolveExistingIdempotencyClaim({
        record: { requestHash: 'hash-a', responseSnapshot: { order: { id: 'order-token' } } },
        requestHash: 'hash-b',
      }),
      (err) => err.code === 'IDEMPOTENCY_KEY_CONFLICT' && err.status === 409,
    );
  });

  it('replays same idempotency key and payload completed response', () => {
    const response = { order: { id: 'po_1' }, payment: { id: 'pay_1' } };
    const replayed = publicStorefrontInternals.resolveExistingIdempotencyClaim({
      record: { requestHash: 'hash-a', responseSnapshot: response },
      requestHash: 'hash-a',
    });
    return replayed.then((value) => assert.equal(value, response));
  });

  it('returns a safe processing response for concurrent duplicate checkout', async () => {
    const response = await publicStorefrontInternals.resolveExistingIdempotencyClaim({
      record: { requestHash: 'hash-a', status: 'processing', responseSnapshot: null },
      requestHash: 'hash-a',
    });
    assert.equal(response.idempotency.status, 'processing');
    assert.equal(response.next.retry_after_seconds, 5);
  });

  it('returns a retryable recovery error for provider creation failure records', async () => {
    await assert.rejects(
      () => publicStorefrontInternals.resolveExistingIdempotencyClaim({
        record: { id: 'idem-1', requestHash: 'hash-a', status: 'failed', errorSnapshot: { code: 'PAYMENT_PROVIDER_ERROR' } },
        requestHash: 'hash-a',
      }),
      (err) => err.code === 'PAYMENT_CREATION_RECOVERY_REQUIRED' && err.status === 503 && err.details.idempotency.retryable === true,
    );

    const sanitized = publicStorefrontInternals.sanitizePaymentCreationError({ code: 'PAYMENT_PROVIDER_ERROR', message: 'secret token leaked', status: 502 });
    assert.equal(sanitized.code, 'PAYMENT_PROVIDER_ERROR');
    assert.equal(sanitized.status, 502);
    assert.equal(JSON.stringify(sanitized).includes('secret token leaked'), false);
    assert.equal(sanitized.recovery.includes('order_idempotency_records'), true);
  });
});
