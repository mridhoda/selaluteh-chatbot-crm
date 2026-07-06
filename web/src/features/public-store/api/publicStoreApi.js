import { mockCart, mockCategories, mockProducts, mockPublicOrder, mockStorefront } from '../data/publicStore.mock'
import { calculateCartTotals } from '../utils/calculateDisplayTotal'

const USE_MOCK_PUBLIC_STORE = true

const delay = (value, ms = 180) => new Promise((resolve) => setTimeout(() => resolve(value), ms))

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export const publicStoreApi = {
  async getStorefront(storefrontSlug) {
    if (!USE_MOCK_PUBLIC_STORE) throw new Error('Public storefront API is not connected yet.')
    if (storefrontSlug && storefrontSlug !== mockStorefront.slug) {
      return delay({ storefront: null, categories: [], products: [] })
    }
    return delay({
      storefront: clone(mockStorefront),
      categories: clone(mockCategories),
      products: clone(mockProducts),
    })
  },

  async createGuestSession(storefrontSlug) {
    return delay({ guestSessionToken: `guest_${storefrontSlug || 'mock'}_${Date.now()}` })
  },

  async getCart() {
    return delay(clone(mockCart))
  },

  async addCartItem(payload) {
    return delay({ ok: true, item: clone(payload) })
  },

  async updateCartItemQuantity(cartItemId, quantity) {
    return delay({ ok: true, cartItemId, quantity })
  },

  async removeCartItem(cartItemId) {
    return delay({ ok: true, cartItemId })
  },

  async checkout({ customer, cart }) {
    return delay({
      checkoutToken: 'mock-checkout-token',
      paymentUrl: 'https://payments.example.test/selaluteh/mock-checkout-token',
      publicOrderToken: 'mock-public-order',
      customer,
      totals: calculateCartTotals(cart?.items || []),
    }, 260)
  },

  async getPaymentStatus(checkoutToken) {
    return delay({
      checkoutToken,
      state: 'pending',
      paymentUrl: 'https://payments.example.test/selaluteh/mock-checkout-token',
      publicOrderToken: 'mock-public-order',
      expiresAt: new Date(Date.now() + 14 * 60 * 1000).toISOString(),
    })
  },

  async getPublicOrder() {
    return delay(clone(mockPublicOrder))
  },
}
