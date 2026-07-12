import { getApiErrorMessage } from '../../../shared/api/apiError.js'
import selkopAlphaImage from '../../../assets/product-image/minuman/Selkop Aren Creamy & Alpha.webp'
import selkopSocietyImage from '../../../assets/product-image/selkop-society.webp'

const UNIVERSAL_SCOPE = 'UNIVERSAL'
const OUTLET_SCOPE = 'OUTLET'
const LOCATION_SCOPE = 'LOCATION'

function arrayFrom(value) {
  return Array.isArray(value) ? value : []
}

function normalizeProduct(product = {}, categoryByName = new Map()) {
  const availability = product.availability || (product.isAvailable === false ? 'sold_out' : 'available')
  const isAvailable = product.isAvailable !== false && !['sold_out', 'unavailable', 'disabled'].includes(String(availability).toLowerCase())
  const categoryName = product.category || product.categoryName || product.metadata?.category || 'Menu'
  const categoryId = product.categoryId || product.category_id || categoryByName.get(String(categoryName).trim().toLowerCase()) || categoryName
  const bundledImage = {
    'selkop alpha': selkopAlphaImage,
    'selkop society': selkopSocietyImage,
  }[String(product.name || '').trim().toLowerCase()]
  const imageUrl = bundledImage || product.imageUrl || product.image_url || product.thumbnailUrl || product.thumbnail_url || product.image || null

  const modifierGroups = arrayFrom(product.modifierGroups || product.modifiers).map((group) => {
    const type = group.type || (Number(group.maxSelections ?? group.max_selections ?? group.maxSelect ?? 1) === 1 ? 'SINGLE' : 'MULTIPLE')
    return {
      ...group,
      title: group.title || group.name || group.label || 'Options',
      type: String(type).toUpperCase() === 'MULTI' ? 'MULTIPLE' : String(type).toUpperCase(),
      isRequired: group.isRequired ?? group.required ?? Number(group.minSelections ?? group.min_selections ?? group.minSelect ?? 0) > 0,
      minSelect: group.minSelect ?? group.minSelections ?? group.min_selections ?? 0,
      maxSelect: group.maxSelect ?? group.maxSelections ?? group.max_selections ?? null,
      options: arrayFrom(group.options).map((option) => ({
        ...option,
        isAvailable: option.isAvailable !== false && option.is_active !== false,
        priceDeltaMinor: option.priceDeltaMinor ?? option.pricePreviewMinor ?? option.priceDelta ?? option.price_delta ?? option.price ?? 0,
      })),
    }
  })

  return {
    ...product,
    category: categoryName,
    categoryId,
    imageUrl,
    basePriceMinor: product.basePriceMinor ?? product.pricePreviewMinor ?? product.priceMinor ?? product.unit_price ?? product.unitPrice ?? 0,
    isAvailable,
    availability,
    availabilityLabel: product.availabilityLabel || (isAvailable ? 'Available' : 'Sold Out'),
    modifierGroups,
  }
}

function sortStoreCategories(categories) {
  const priority = (category) => {
    const name = String(category.name || category.label || '').trim().toLowerCase()
    if (name === 'minuman') return 0
    if (name === 'makanan') return 1
    return 2
  }
  return [...categories].sort((a, b) => priority(a) - priority(b))
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
  const categories = sortStoreCategories(arrayFrom(response.categories || menu.categories || response.data?.categories))
  const categoryByName = new Map(categories.map((category) => [String(category.name || category.label || category.id || '').trim().toLowerCase(), category.id]))
  const products = arrayFrom(response.products || menu.products || response.data?.products).map((product) => normalizeProduct(product, categoryByName))
  const pagination = response.pagination || menu.pagination || response.data?.pagination || {}
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
          banners: Array.isArray(storefront.banners) ? storefront.banners : [],
          banner: {
            ...(storefront.banner || (Array.isArray(storefront.banners) && storefront.banners[0]) || {
            title: storefront.name || storefront.brandName || 'Online Store',
            subtitle: 'Pilih outlet dan menu yang tersedia.',
            }),
            items: Array.isArray(storefront.banners) ? storefront.banners : [],
            intervalSeconds: storefront.bannerIntervalSeconds || 5,
          },
        }
      : null,
    categories,
    products,
    pagination: {
      page: Number(pagination.page || 0),
      limit: Number(pagination.limit || products.length),
      total: Number(pagination.total || products.length),
      hasNext: pagination.hasNext === true,
    },
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
