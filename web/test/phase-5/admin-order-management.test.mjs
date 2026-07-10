import assert from 'node:assert/strict'
import test from 'node:test'

import { createPhase5ApiClient } from '../../src/features/public-store/api/phase5ApiClient.js'
import { createAdminOrdersApi } from '../../src/modules/orders/api/adminOrdersApi.js'
import {
  getRenderableAdminActions,
  mapAdminOrderError,
  normalizeAdminOrderDetail,
  normalizeAdminOrderList,
  validateAdminAction,
} from '../../src/modules/orders/models/adminOrderModel.js'
import { phase5ApiFixtures } from './fixtures/api-contract-fixtures.mjs'

function createRecordingFetch(responseBody = { order: phase5ApiFixtures.adminOrderDetail }) {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), options })
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => responseBody,
      text: async () => JSON.stringify(responseBody),
    }
  }
  return { calls, fetchImpl }
}

test('normalizes admin order list and detail without provider secrets or raw payloads', () => {
  const list = normalizeAdminOrderList({
    data: [{
      ...phase5ApiFixtures.adminOrderDetail,
      allowed_actions: ['accept_order', 'mark_preparing', 'not_a_real_action'],
      provider_payload: { secret: 'hidden' },
      bayargg_api_key: 'secret-key',
      adminNotes: 'private admin note',
      adminUser: { id: 'admin-private-001' },
    }],
    pagination: { total: 1 },
  })
  const detail = normalizeAdminOrderDetail({ order: phase5ApiFixtures.adminOrderDetail })

  assert.equal(list.orders.length, 1)
  assert.equal(list.orders[0].id, 'order-test-001')
  assert.equal(list.orders[0].paymentStatus, 'Paid')
  assert.equal(list.orders[0].paymentStatusRaw, 'paid')
  assert.equal(list.orders[0].orderIdDisplay, 'STH-TEST-001')
  assert.equal(list.orders[0].status, 'new')
  assert.equal(list.orders[0].fulfillmentStatus, 'awaiting_acceptance')
  assert.equal(list.orders[0].allowedActions.includes('not_a_real_action'), false)
  assert.equal(JSON.stringify(list).includes('secret-key'), false)
  assert.equal(JSON.stringify(list).includes('provider_payload'), false)
  assert.equal(JSON.stringify(list).includes('private admin note'), false)
  assert.equal(JSON.stringify(list).includes('admin-private-001'), false)
  assert.equal(detail.qrContext.locationLabel, 'Table 7')
})

test('normalizes backend aliases into legacy OrdersPage-compatible fields', () => {
  const detail = normalizeAdminOrderDetail({
    order: {
      order_id: 'order-alias-001',
      order_number: 'STH-ALIAS-001',
      customer_snapshot: { name: 'Alias Customer' },
      customer_phone_snapshot: '628347731924',
      contactId: { id: 'contact-001' },
      outlet_id: 'outlet-alias-001',
      outlet_name: 'SELKOP Alias',
      channel: 'qr_store',
      qr_context: { qr_scope: 'universal' },
      payment_status: 'paid',
      fulfillment_status: 'accepted',
      public_order_status: 'preparing',
      line_items: [
        {
          item_snapshot: { name: 'Es Teh Alias' },
          qty: '2',
          unit_price: '12000',
          selectedModifiers: [{ name: 'Less Ice' }],
        },
      ],
      total_amount: '24000',
      created_at: 'not-a-date',
      qrContext: {
        location: { label: 'Location QR' },
        table: { label: 'Table A3' },
      },
    },
  })

  assert.equal(detail._id, 'order-alias-001')
  assert.equal(detail.orderIdDisplay, 'STH-ALIAS-001')
  assert.equal(detail.contactId.name, 'Alias Customer')
  assert.equal(detail.contactId.phone, '628347731924')
  assert.equal(detail.customerPhoneSnapshot, '628347731924')
  assert.equal(detail.outletId, 'outlet-alias-001')
  assert.equal(detail.outlet, 'SELKOP Alias')
  assert.equal(detail.channel, 'qr_store')
  assert.equal(detail.customerIdentifier, '628347731924')
  assert.equal(detail.paymentStatus, 'Paid')
  assert.equal(detail.status, 'processed')
  assert.equal(detail.itemsCount, '2 items')
  assert.deepEqual(detail.itemsList, [{ name: 'Es Teh Alias', qty: 2, variant: 'Less Ice', price: 12000 }])
  assert.equal(detail.total, 24000)
  assert.equal(Number.isNaN(new Date(detail.createdAt).getTime()), false)
  assert.equal(detail.qrContext.locationLabel, 'Location QR')
  assert.equal(detail.tableLabel, 'Table A3')
  assert.equal(detail.qrLabel, 'Universal QR')
})

test('universal QR label does not expose internal table or location ids', () => {
  const detail = normalizeAdminOrderDetail({
    order: {
      id: 'order-universal-qr-001',
      channel: 'qr_store',
      qr_context: {
        qr_scope: 'universal',
        table_id: '4f758d2c-d4f5-4f7f-8a80-c8341c5cd7aa',
      },
    },
  })

  assert.equal(detail.tableLabel, null)
  assert.equal(detail.qrLabel, 'Universal QR')
  assert.equal(JSON.stringify(detail).includes('Universal QR · 4f758d2c'), false)
})

test('normalizes customer identifier by order channel without exposing internal ids for QR and online orders', () => {
  const whatsapp = normalizeAdminOrderDetail({
    order: {
      id: 'order-wa-001',
      channel: 'whatsapp',
      contact: { id: 'contact-wa-private', name: 'WA Customer', phone: '628111111111' },
    },
  })
  const telegram = normalizeAdminOrderDetail({
    order: {
      id: 'order-tg-001',
      channel: 'telegram',
      contact: { id: 'contact-tg-private', name: 'TG Customer', handle: '@tehlover', telegram_id: '998877' },
    },
  })
  const qrStore = normalizeAdminOrderDetail({
    order: {
      id: 'order-qr-001',
      channel: 'qr_store',
      customer: { name: 'QR Customer', phone: '628347731924' },
      contactId: { id: 'contact-qr-private', name: 'QR Customer' },
    },
  })
  const onlineStore = normalizeAdminOrderDetail({
    order: {
      id: 'order-web-001',
      channel: 'online_store',
      customer_snapshot: { name: 'Online Customer' },
      contactId: { id: 'contact-web-private', name: 'Online Customer' },
    },
  })

  assert.equal(whatsapp.customerIdentifier, '628111111111')
  assert.equal(telegram.customerIdentifier, '@tehlover')
  assert.equal(qrStore.channel, 'qr_store')
  assert.equal(qrStore.customerIdentifier, '628347731924')
  assert.equal(onlineStore.channel, 'website')
  assert.equal(onlineStore.customerIdentifier, '-')
})

test('admin order model does not treat generic notes as customer-facing admin note fallback', () => {
  const detail = normalizeAdminOrderDetail({
    order: {
      id: 'order-private-note',
      orderNumber: 'STH-PRIVATE',
      notes: 'internal-only admin note',
      customerNote: '',
      allowed_actions: [],
    },
  })

  assert.equal(detail.customerNote, null)
  assert.equal(JSON.stringify(detail).includes('internal-only admin note'), false)
})

test('renders only backend allowed_actions and does not guess from status fields', () => {
  const unpaidPreparing = normalizeAdminOrderDetail({
    order: {
      id: 'order-no-actions',
      payment_status: 'paid',
      fulfillment_status: 'preparing',
      allowed_actions: [],
    },
  })
  const allowed = normalizeAdminOrderDetail({
    order: {
      id: 'order-actions',
      payment_status: 'paid',
      fulfillment_status: 'preparing',
      allowed_actions: ['accept_order', 'mark_preparing', 'mark_ready', 'cancel_order'],
    },
  })

  assert.deepEqual(getRenderableAdminActions(unpaidPreparing), [])
  assert.deepEqual(getRenderableAdminActions(allowed).map((item) => item.action), ['mark_ready', 'cancel_order'])
})

test('explicit action endpoints are used and generic status patch is never sent', async () => {
  const { calls, fetchImpl } = createRecordingFetch(phase5ApiFixtures.adminOrderActionResponse)
  const client = createPhase5ApiClient({ baseUrl: 'https://api.example.test', fetchImpl })

  await client.admin.acceptOrder('order-test-001')
  await client.admin.prepareOrder('order-test-001')
  await client.admin.readyOrder('order-test-001')
  await client.admin.completeOrder('order-test-001')
  await client.admin.cancelOrder('order-test-001', { reason: 'customer requested' })

  assert.deepEqual(calls.map((call) => [call.options.method, call.url]), [
    ['POST', 'https://api.example.test/api/v1/admin/orders/order-test-001/accept'],
    ['POST', 'https://api.example.test/api/v1/admin/orders/order-test-001/prepare'],
    ['POST', 'https://api.example.test/api/v1/admin/orders/order-test-001/ready'],
    ['POST', 'https://api.example.test/api/v1/admin/orders/order-test-001/complete'],
    ['POST', 'https://api.example.test/api/v1/admin/orders/order-test-001/cancel'],
  ])
  assert.equal(calls.some((call) => call.options.method === 'PATCH'), false)
  assert.equal(calls.some((call) => call.url.includes('/status')), false)
})

test('cancel requires reason and duplicate action submission is rejected before request', async () => {
  const { fetchImpl } = createRecordingFetch(phase5ApiFixtures.adminOrderActionResponse)
  const client = createPhase5ApiClient({ baseUrl: 'https://api.example.test', fetchImpl })

  await assert.rejects(() => client.admin.cancelOrder('order-test-001', { reason: '' }), /Cancel reason is required/)
  assert.deepEqual(validateAdminAction({ action: 'cancel_order', reason: '', inFlightAction: '' }), { ok: false, message: 'Cancel reason must be at least 5 characters.' })
  assert.deepEqual(validateAdminAction({ action: 'mark_ready', reason: '', inFlightAction: 'mark_ready' }), { ok: false, message: 'Another order action is already in progress.' })
  assert.deepEqual(validateAdminAction({ action: 'mark_ready', reason: '', inFlightAction: '' }), { ok: true, message: null })
})

test('legacy admin orders API accepts string or object cancel reason without nesting', async () => {
  const { calls, fetchImpl } = createRecordingFetch(phase5ApiFixtures.adminOrderActionResponse)
  const api = createAdminOrdersApi({
    baseUrl: 'https://api.example.test',
    fetchImpl,
    getAuthToken: () => '',
    getWorkspaceId: () => '',
  })

  await api.cancelOrder('order-test-001', 'customer requested')
  await api.cancelOrder('order-test-002', { reason: 'out of stock' })
  assert.equal(api.acceptOrder, undefined)
  assert.equal(api.prepareOrder, undefined)

  assert.deepEqual(calls.map((call) => JSON.parse(call.options.body)), [
    { reason: 'customer requested' },
    { reason: 'out of stock' },
  ])
})

test('admin action errors are mapped safely', () => {
  assert.equal(mapAdminOrderError({ code: 'ORDER_INVALID_TRANSITION' }), 'This order cannot move to the requested status.')
  assert.equal(mapAdminOrderError({ code: 'ORDER_UNPAID' }), 'This order is not paid yet.')
  assert.equal(mapAdminOrderError({ code: 'FORBIDDEN' }), 'You are not allowed to perform this action.')
})
