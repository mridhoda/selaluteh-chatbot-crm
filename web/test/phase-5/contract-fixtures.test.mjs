import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { assertBackendErrorShape, assertNoFrontendAuthorityFields } from './helpers/assertions.mjs'
import { createCheckoutIdempotencyKeyFixture, createQrTokenFixture } from './helpers/ids.mjs'
import { phase5ApiFixtures } from './fixtures/api-contract-fixtures.mjs'

describe('Phase 5 API contract fixtures', () => {
  it('provide deterministic checkout idempotency and QR token fixtures', () => {
    assert.equal(createCheckoutIdempotencyKeyFixture('abc'), 'phase5-checkout-idempotency-abc')
    assert.equal(createQrTokenFixture('abc'), 'qr_phase5_abc_token_fixture')
  })

  it('keep checkout request fixtures free from backend-owned authority fields', () => {
    assert.equal(phase5ApiFixtures.checkoutRequest.headers['Idempotency-Key'], createCheckoutIdempotencyKeyFixture())
    assertNoFrontendAuthorityFields(phase5ApiFixtures.checkoutRequest.body)
  })

  it('keep admin action request fixtures explicit and free from generic status patches', () => {
    assert.equal(phase5ApiFixtures.adminOrderActionRequest.action, 'accept')
    assertNoFrontendAuthorityFields(phase5ApiFixtures.adminOrderActionRequest.body)
    assert.ok(!Object.hasOwn(phase5ApiFixtures.adminOrderActionRequest.body, 'status'))
  })

  it('include backend-owned response fields only as fake backend responses', () => {
    assert.equal(phase5ApiFixtures.checkoutResponse.paymentStatus, 'pending')
    assert.equal(phase5ApiFixtures.adminOrderDetail.allowedActions[0], 'accept')
  })

  it('provide critical backend error fixtures with stable code/message shape', () => {
    for (const errorFixture of Object.values(phase5ApiFixtures.backendErrors)) {
      assert.equal(errorFixture.ok, false)
      assertBackendErrorShape(errorFixture.error)
    }
  })
})
