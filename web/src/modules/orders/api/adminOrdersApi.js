import { createPhase5ApiClient } from '../../../features/public-store/api/phase5ApiClient.js'

function readStoredJson(key) {
  try {
    const value = sessionStorage.getItem(key) || localStorage.getItem(key)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function getAuthToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
}

function getWorkspaceId() {
  const user = readStoredJson('user') || {}
  return user.workspaceId || user.workspace_id || user.currentWorkspaceId || user.workspace?.id || ''
}

export function createAdminOrdersApi(options = {}) {
  const client = createPhase5ApiClient({ getAuthToken, getWorkspaceId, ...options }).admin
  const { acceptOrder, prepareOrder, ...safeClient } = client
  return {
    ...safeClient,
    getAdminOrders(params) {
      return client.listOrders(params)
    },
    getAdminOrderDetail(orderId) {
      return client.getOrder(orderId)
    },
    readyOrder(orderId) {
      return client.readyOrder(orderId)
    },
    completeOrder(orderId) {
      return client.completeOrder(orderId)
    },
    cancelOrder(orderId, reason) {
      const body = reason && typeof reason === 'object'
        ? { reason: reason.reason }
        : { reason }
      return client.cancelOrder(orderId, body)
    },
  }
}

export const adminOrdersApi = createAdminOrdersApi()
