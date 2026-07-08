import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertNoLockedQrOverride,
  canSelectOutletForQr,
  createStoreIntentContext,
  getEligibleOutlets,
  getSafePublicStoreError,
  normalizeQrResolveResponse,
  resolveSelectedOutlet,
} from '../../src/features/public-store/utils/publicStoreModel.js'
import { backendErrorFixtures, publicStorefrontFixture, qrResolveFixture } from './fixtures/api-contract-fixtures.mjs'

test('Universal QR uses backend-provided eligible outlets and allows selection', () => {
  const qrModel = normalizeQrResolveResponse({
    qrScope: 'UNIVERSAL',
    qrSessionToken: 'qr_session_safe',
    storefront: publicStorefrontFixture.storefront,
    eligibleOutlets: [
      { id: 'outlet-a', name: 'Outlet A', isAvailable: true },
      { id: 'outlet-b', name: 'Outlet B', isAvailable: false },
    ],
    menu: publicStorefrontFixture.menu,
  })

  assert.equal(qrModel.qrScope, 'UNIVERSAL')
  assert.equal(canSelectOutletForQr(qrModel), true)
  assert.deepEqual(getEligibleOutlets({ outlets: qrModel.eligibleOutlets, qrScope: qrModel.qrScope }).map((outlet) => outlet.id), ['outlet-a'])
  assert.equal(resolveSelectedOutlet({ requestedOutletId: 'outlet-a', outlets: qrModel.eligibleOutlets, qrScope: qrModel.qrScope })?.id, 'outlet-a')
})

test('Universal QR missing outlet remains unselected until user chooses eligible outlet', () => {
  const qrModel = normalizeQrResolveResponse({
    qrScope: 'UNIVERSAL',
    qrSessionToken: 'qr_session_safe',
    storefront: publicStorefrontFixture.storefront,
    eligibleOutlets: [{ id: 'outlet-a', name: 'Outlet A', isAvailable: true }],
    menu: publicStorefrontFixture.menu,
  })

  assert.equal(resolveSelectedOutlet({ requestedOutletId: '', outlets: qrModel.eligibleOutlets, qrScope: qrModel.qrScope }), null)
})

test('Outlet QR locks backend outlet and prevents selector override', () => {
  const qrModel = normalizeQrResolveResponse({ ...qrResolveFixture, qrScope: 'OUTLET' })

  assert.equal(qrModel.qrScope, 'OUTLET')
  assert.equal(canSelectOutletForQr(qrModel), false)
  assert.deepEqual(getEligibleOutlets({ outlets: qrModel.eligibleOutlets, qrScope: qrModel.qrScope, lockedOutlet: qrModel.lockedOutlet }).map((outlet) => outlet.id), ['outlet-smd-001'])
  assert.equal(resolveSelectedOutlet({ requestedOutletId: 'different-outlet', outlets: qrModel.eligibleOutlets, qrScope: qrModel.qrScope, lockedOutlet: qrModel.lockedOutlet })?.id, 'outlet-smd-001')
  assert.throws(() => assertNoLockedQrOverride({ qrModel, selectedOutletId: 'different-outlet' }), /QR_OUTLET_MISMATCH/)
})

test('Location QR locks backend outlet and location and prevents override', () => {
  const qrModel = normalizeQrResolveResponse({ ...qrResolveFixture, qrScope: 'LOCATION' })

  assert.equal(qrModel.qrScope, 'LOCATION')
  assert.equal(qrModel.lockedOutlet.id, 'outlet-smd-001')
  assert.equal(qrModel.lockedLocation.label, 'Table 7')
  assert.equal(canSelectOutletForQr(qrModel), false)
  assert.throws(() => assertNoLockedQrOverride({ qrModel, selectedOutletId: 'outlet-smd-001', selectedLocationId: 'different-location' }), /QR_LOCATION_MISMATCH/)
})

test('QR session token is included only in intent context after backend resolve', () => {
  const qrModel = normalizeQrResolveResponse({ ...qrResolveFixture, qrScope: 'LOCATION' })
  const intent = createStoreIntentContext({ storefrontSlug: 'selalu-kopi', selectedOutlet: qrModel.lockedOutlet, qrModel })

  assert.equal(intent.storefrontSlug, 'selalu-kopi')
  assert.equal(intent.outletId, 'outlet-smd-001')
  assert.equal(intent.qrSessionToken, qrResolveFixture.qrSessionToken)
  assert.equal(intent.qrLocationId, 'qr-location-table-07')
})

test('QR mismatch backend errors map to safe public messages', () => {
  assert.equal(
    getSafePublicStoreError({ error: backendErrorFixtures.qrOutletMismatch.error }),
    'This QR code is not valid for the selected outlet.',
  )
  assert.equal(
    getSafePublicStoreError({ error: backendErrorFixtures.qrLocationMismatch.error }),
    'This QR code is not valid for the selected location.',
  )
})
