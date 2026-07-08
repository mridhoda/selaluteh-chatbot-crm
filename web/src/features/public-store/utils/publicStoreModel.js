import { getApiErrorMessage } from '../../../shared/api/apiError.js'

const UNIVERSAL_SCOPE = 'UNIVERSAL'
const OUTLET_SCOPE = 'OUTLET'
const LOCATION_SCOPE = 'LOCATION'

function arrayFrom(value) {
  return Array.isArray(value) ? value : []
}

function normalizeProduct(product = {}) {
  const availability = product.availability || (product.isAvailable === false ? 'sold_out' : 'available')
  const isAvailable = product.isAvailable !== false && !['sold_out', 'unavailable', 'disabled'].includes(String(availability).toLowerCase())

  return {
    ...product,
    basePriceMinor: product.basePriceMinor ?? product.pricePreviewMinor ?? product.priceMinor ?? 0,
    isAvailable,
    availability,
    availabilityLabel: product.availabilityLabel || (isAvailable ? 'Available' : 'Sold Out'),
    modifierGroups: arrayFrom(product.modifierGroups).map((group) => ({
      ...group,
      type: group.type || (group.maxSelect === 1 ? 'SINGLE' : 'MULTIPLE'),
      options: arrayFrom(group.options).map((option) => ({
        ...option,
        isAvailable: option.isAvailable !== false,
        priceDeltaMinor: option.priceDeltaMinor ?? option.pricePreviewMinor ?? 0,
      })),
    })),
  }
}

function normalizeOutlet(outlet = {}, locked = false) {
  return {
    ...outlet,
    isAvailable: outlet.isAvailable !== false && outlet.isActive !== false && outlet.disabled !== true,
    isLockedFromQr: locked || outlet.isLockedFromQr === true,
  }
}

export function normalizeStorefrontResponse(response = {}) {
  const storefront = response.storefront || response.data?.storefront || null
  const menu = response.menu || response.data?.menu || {}
  const categories = arrayFrom(response.categories || menu.categories || response.data?.categories)
  const products = arrayFrom(response.products || menu.products || response.data?.products).map(normalizeProduct)
  const outlets = arrayFrom(response.outlets || response.eligibleOutlets || response.data?.outlets).map((outlet) => normalizeOutlet(outlet))
  const singleOutlet = response.outlet || response.data?.outlet || storefront?.outlet
  const normalizedOutlets = outlets.length ? outlets : singleOutlet ? [normalizeOutlet(singleOutlet)] : []

  return {
    storefront: storefront
      ? {
          ...storefront,
          slug: storefront.slug || response.storefrontSlug,
          isActive: storefront.isActive ?? storefront.orderingEnabled ?? true,
          theme: storefront.theme || {},
          outlets: normalizedOutlets,
          outlet: normalizedOutlets[0] || null,
          banner: storefront.banner || {
            title: storefront.name || storefront.brandName || 'Online Store',
            subtitle: 'Pilih outlet dan menu yang tersedia.',
          },
        }
      : null,
    categories,
    products,
  }
}

export function normalizeQrResolveResponse(response = {}) {
  const storefrontModel = normalizeStorefrontResponse(response)
  const qrSession = response.qrSession || response.session || {}
  const rawScope = response.qrScope || response.scope || response.qrCode?.scope || qrSession.scope
  const lockedOutlet = response.lockedOutlet || response.outlet || qrSession.outlet || null
  const lockedLocation = response.lockedLocation || response.qrContext || response.location || qrSession.location || null
  const scope = rawScope || (lockedLocation ? LOCATION_SCOPE : lockedOutlet ? OUTLET_SCOPE : UNIVERSAL_SCOPE)
  const isLocationScope = scope === LOCATION_SCOPE
  const isOutletScope = scope === OUTLET_SCOPE || isLocationScope
  const lockedOutletModel = lockedOutlet ? normalizeOutlet(lockedOutlet, true) : null
  const eligibleOutlets = isOutletScope
    ? lockedOutletModel
      ? [lockedOutletModel]
      : []
    : arrayFrom(response.eligibleOutlets || response.outlets || storefrontModel.storefront?.outlets).map((outlet) => normalizeOutlet(outlet))

  return {
    ...storefrontModel,
    qrSessionToken: response.qrSessionToken || response.sessionToken || null,
    qrSession,
    qrScope: scope,
    eligibleOutlets,
    lockedOutlet: lockedOutletModel,
    lockedLocation: lockedLocation
      ? {
          ...lockedLocation,
          id: lockedLocation.id || lockedLocation.qrLocationId || lockedLocation.locationId || null,
          label: lockedLocation.label || lockedLocation.locationLabel || lockedLocation.name || lockedLocation.tableLabel || 'Lokasi terkunci',
        }
      : null,
  }
}

export function getEligibleOutlets({ outlets = [], qrScope, lockedOutlet } = {}) {
  if (qrScope === OUTLET_SCOPE || qrScope === LOCATION_SCOPE) return lockedOutlet ? [lockedOutlet] : []
  return arrayFrom(outlets).filter((outlet) => outlet.isAvailable !== false)
}

export function canSelectOutletForQr(qrModel = {}) {
  return qrModel.qrScope === UNIVERSAL_SCOPE
}

export function resolveSelectedOutlet({ requestedOutletId, outlets = [], qrScope, lockedOutlet } = {}) {
  if (qrScope === OUTLET_SCOPE || qrScope === LOCATION_SCOPE) return lockedOutlet || null
  const eligible = getEligibleOutlets({ outlets, qrScope, lockedOutlet })
  return eligible.find((outlet) => outlet.id === requestedOutletId) || null
}

export function createStoreIntentContext({ storefrontSlug, selectedOutlet, qrModel } = {}) {
  const context = {
    storefrontSlug,
    outletId: selectedOutlet?.id || null,
  }

  if (qrModel?.qrSessionToken) context.qrSessionToken = qrModel.qrSessionToken
  if (qrModel?.qrScope === LOCATION_SCOPE && qrModel.lockedLocation?.id) context.qrLocationId = qrModel.lockedLocation.id
  return context
}

export function assertNoLockedQrOverride({ qrModel, selectedOutletId, selectedLocationId } = {}) {
  if (!qrModel) return true
  if ((qrModel.qrScope === OUTLET_SCOPE || qrModel.qrScope === LOCATION_SCOPE) && selectedOutletId && selectedOutletId !== qrModel.lockedOutlet?.id) {
    throw new Error('QR_OUTLET_MISMATCH')
  }
  if (qrModel.qrScope === LOCATION_SCOPE && selectedLocationId && selectedLocationId !== qrModel.lockedLocation?.id) {
    throw new Error('QR_LOCATION_MISMATCH')
  }
  return true
}

export function validateModifierSelection(product = {}, selectedOptionIds = []) {
  const errors = {}
  arrayFrom(product.modifierGroups).forEach((group) => {
    const groupOptions = arrayFrom(group.options)
    const selectedCount = selectedOptionIds.filter((id) => groupOptions.some((option) => option.id === id)).length
    if (group.isRequired && selectedCount < (group.minSelect || 1)) {
      errors[group.id] = `Pilih minimal ${group.minSelect || 1} opsi.`
    }
    if (group.maxSelect && selectedCount > group.maxSelect) {
      errors[group.id] = `Pilih maksimal ${group.maxSelect} opsi.`
    }
  })
  return errors
}

export function getSafePublicStoreError(error, fallback = 'Gagal memuat store. Silakan coba lagi.') {
  return getApiErrorMessage(error, fallback)
}
