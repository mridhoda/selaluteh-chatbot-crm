export function createFakeInventoryAdapter() {
  return {
    checkAvailability: async (productId, outletId, quantity) => ({ available: true, quantity }),
    reserveStock: async (productId, outletId, quantity, referenceId) => ({ success: true, reservationId: `inv-${Date.now()}` }),
    releaseStock: async (reservationId) => ({ success: true }),
    consumeStock: async (reservationId) => ({ success: true }),
  };
}

export function createFakeOutletAdapter() {
  return {
    getOutlet: async (outletId) => ({ id: outletId, name: 'Test Outlet', status: 'ACTIVE', acceptsOrders: true }),
    acceptsOrders: async (outletId) => ({ allowed: true }),
  };
}

export function createFakeMediaAdapter() {
  return {
    getSignedUrl: async (assetId) => `https://cdn.test.com/${assetId}`,
    validateOwnership: async (assetId, workspaceId) => true,
  };
}
