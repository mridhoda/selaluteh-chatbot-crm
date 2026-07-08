import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getEligibleOutlets,
  getSafePublicStoreError,
  normalizeStorefrontResponse,
  validateModifierSelection,
} from '../../src/features/public-store/utils/publicStoreModel.js'
import { backendErrorFixtures, publicStorefrontFixture } from './fixtures/api-contract-fixtures.mjs'

test('normalizes storefront loading response with identity, outlets, categories, and products', () => {
  const model = normalizeStorefrontResponse(publicStorefrontFixture)

  assert.equal(model.storefront.slug, 'selalu-kopi')
  assert.equal(model.storefront.brandName, 'Selkop')
  assert.equal(model.storefront.isActive, true)
  assert.equal(model.storefront.outlets.length, 1)
  assert.equal(model.categories[0].name, 'Signature')
  assert.equal(model.products[0].name, 'Selkop Aren Creamy')
})

test('normalizes invalid storefront as empty safe state', () => {
  const model = normalizeStorefrontResponse({ storefront: null, menu: { categories: [], products: [] }, outlets: [] })

  assert.equal(model.storefront, null)
  assert.deepEqual(model.categories, [])
  assert.deepEqual(model.products, [])
})

test('outlet selector only exposes active backend-provided outlets', () => {
  const outlets = getEligibleOutlets({
    outlets: [
      { id: 'outlet-open', isAvailable: true },
      { id: 'outlet-disabled', isAvailable: false },
    ],
    qrScope: 'UNIVERSAL',
  })

  assert.deepEqual(outlets.map((outlet) => outlet.id), ['outlet-open'])
})

test('product list normalizes sold-out products as unavailable', () => {
  const model = normalizeStorefrontResponse({
    storefront: publicStorefrontFixture.storefront,
    outlets: publicStorefrontFixture.outlets,
    menu: {
      categories: publicStorefrontFixture.menu.categories,
      products: [{ id: 'prod-sold-out', name: 'Sold Out Drink', availability: 'sold_out', basePriceMinor: 12000 }],
    },
  })

  assert.equal(model.products[0].isAvailable, false)
  assert.equal(model.products[0].availabilityLabel, 'Sold Out')
})

test('modifier picker returns errors for missing required modifiers and none for valid intent', () => {
  const product = {
    id: 'prod-test',
    modifierGroups: [
      {
        id: 'grp-sugar',
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
        options: [{ id: 'opt-normal' }],
      },
    ],
  }

  assert.deepEqual(validateModifierSelection(product, []), { 'grp-sugar': 'Pilih minimal 1 opsi.' })
  assert.deepEqual(validateModifierSelection(product, ['opt-normal']), {})
})

test('invalid storefront backend error maps to safe public message', () => {
  const message = getSafePublicStoreError({ error: { code: 'INTERNAL_ERROR', stack: 'private stack' } })

  assert.equal(message, 'Unexpected server error. Please try again later.')
  assert.equal(message.includes('private stack'), false)
})

test('expired and revoked backend errors map to safe public messages', () => {
  assert.equal(
    getSafePublicStoreError({ error: backendErrorFixtures.qrExpired.error }),
    'QR code has expired. Please scan a fresh QR code.',
  )
  assert.equal(
    getSafePublicStoreError({ error: backendErrorFixtures.qrRevoked.error }),
    'This QR code is no longer active.',
  )
})
