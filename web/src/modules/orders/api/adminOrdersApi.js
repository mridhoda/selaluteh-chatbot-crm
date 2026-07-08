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
  return createPhase5ApiClient({ getAuthToken, getWorkspaceId, ...options }).admin
}

export const adminOrdersApi = createAdminOrdersApi()
