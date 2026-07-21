export const publicStoreEndpoints = {
  storefront: (slug) => `/public/storefronts/${slug}`,
  guestSession: '/public/storefronts/guest-sessions',
  cart: (cartId) => `/public/carts/${cartId}`,
  recommendations: (slug) => `/public/storefronts/${slug}/recommendations`,
  recommendationEvents: '/public/recommendation-events',
  checkout: '/public/checkouts',
  paymentStatus: (checkoutToken) => `/public/payments/${checkoutToken}/status`,
  publicOrder: (publicOrderToken) => `/public/orders/${publicOrderToken}`,
}
