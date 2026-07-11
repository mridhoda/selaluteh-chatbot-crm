import axios from 'axios'
import { isDemoMode, mockApi } from '../../mocks/demoState'
import { getApiBase } from './apiBase.js'

const api = axios.create({
  baseURL: getApiBase(),
})

// Login normal uses session storage; prefer it over tokens left by older sessions.
function getToken() {
  return sessionStorage.getItem('token') || localStorage.getItem('token') || ''
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Automatically attach active workspace ID to backend requests
  try {
    const userStr = sessionStorage.getItem('user') || localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const workspaceId = user?.workspaceId || user?.workspace_id || user?.currentWorkspaceId || user?.workspace?.id
      if (workspaceId) {
        config.headers['x-workspace-id'] = workspaceId
      }
    }
  } catch (e) {
    // ignore parsing errors
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const hadToken = !!getToken()
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      if (hadToken && window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

if (typeof window !== 'undefined') {
  const realGet = api.get.bind(api)
  const realPost = api.post.bind(api)
  const realPatch = api.patch.bind(api)
  const realPut = api.put.bind(api)
  const realDelete = api.delete.bind(api)

  api.get = (url, config) =>
    isDemoMode() ? mockApi('get', url, undefined, config) : realGet(url, config)
  api.post = (url, data, config) =>
    isDemoMode()
      ? mockApi('post', url, data, config)
      : realPost(url, data, config)
  api.patch = (url, data, config) =>
    isDemoMode()
      ? mockApi('patch', url, data, config)
      : realPatch(url, data, config)
  api.put = (url, data, config) =>
    isDemoMode()
      ? mockApi('put', url, data, config)
      : realPut(url, data, config)
  api.delete = (url, config) =>
    isDemoMode()
      ? mockApi('delete', url, undefined, config)
      : realDelete(url, config)
}

export default api
