export const publicStoreEndpoints = {
  storefront: (slug) => `/public/storefronts/${slug}`,
  guestSession: '/public/storefronts/guest-sessions',
  cart: (cartId) => `/public/carts/${cartId}`,
  checkout: '/public/checkouts',
  paymentStatus: (checkoutToken) => `/public/payments/${checkoutToken}/status`,
  publicOrder: (publicOrderToken) => `/public/orders/${publicOrderToken}`,
}
