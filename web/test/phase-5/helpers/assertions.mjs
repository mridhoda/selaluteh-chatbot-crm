import assert from 'node:assert/strict'

const forbiddenFrontendAuthorityFields = [
  'payment_status',
  'paymentStatus',
  'fulfillment_status',
  'fulfillmentStatus',
  'allowed_actions',
  'allowedActions',
  'final_total',
  'finalTotal',
]

export function assertBackendErrorShape(error) {
  assert.equal(typeof error, 'object')
  assert.equal(typeof error.code, 'string')
  assert.equal(typeof error.message, 'string')
  assert.ok(error.code.length > 0)
  assert.ok(error.message.length > 0)
}

export function assertNoFrontendAuthorityFields(payload, path = 'payload') {
  if (payload == null || typeof payload !== 'object') return

  for (const [key, value] of Object.entries(payload)) {
    assert.ok(
      !forbiddenFrontendAuthorityFields.includes(key),
      `${path}.${key} must remain backend-owned`,
    )
    assertNoFrontendAuthorityFields(value, `${path}.${key}`)
  }
}

export function assertErrorState(result, expectedCode) {
  assert.equal(result.ok, false)
  assertBackendErrorShape(result.error)
  if (expectedCode) assert.equal(result.error.code, expectedCode)
}
