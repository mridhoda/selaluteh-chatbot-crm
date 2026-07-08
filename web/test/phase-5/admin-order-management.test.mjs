import assert from 'node:assert/strict'
import test from 'node:test'

import { createPhase5ApiClient } from '../../src/features/public-store/api/phase5ApiClient.js'
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
  assert.equal(list.orders[0].paymentStatus, 'paid')
  assert.equal(list.orders[0].fulfillmentStatus, 'awaiting_acceptance')
  assert.equal(list.orders[0].allowedActions.includes('not_a_real_action'), false)
  assert.equal(JSON.stringify(list).includes('secret-key'), false)
  assert.equal(JSON.stringify(list).includes('provider_payload'), false)
  assert.equal(JSON.stringify(list).includes('private admin note'), false)
  assert.equal(JSON.stringify(list).includes('admin-private-001'), false)
  assert.equal(detail.qrContext.locationLabel, 'Table 7')
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
      allowed_actions: ['mark_ready', 'cancel_order'],
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
  assert.deepEqual(validateAdminAction({ action: 'cancel_order', reason: '', inFlightAction: '' }), { ok: false, message: 'Cancel reason is required.' })
  assert.deepEqual(validateAdminAction({ action: 'mark_ready', reason: '', inFlightAction: 'mark_ready' }), { ok: false, message: 'Another order action is already in progress.' })
  assert.deepEqual(validateAdminAction({ action: 'mark_ready', reason: '', inFlightAction: '' }), { ok: true, message: null })
})

test('admin action errors are mapped safely', () => {
  assert.equal(mapAdminOrderError({ code: 'ORDER_INVALID_TRANSITION' }), 'This order cannot move to the requested status.')
  assert.equal(mapAdminOrderError({ code: 'ORDER_UNPAID' }), 'This order is not paid yet.')
  assert.equal(mapAdminOrderError({ code: 'FORBIDDEN' }), 'You are not allowed to perform this action.')
})
