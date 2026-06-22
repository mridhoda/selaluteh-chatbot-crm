import axios from 'axios'
import { isDemoMode, mockApi } from '../../mocks/demoState'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000',
})

// ambil token dari localStorage ATAU sessionStorage
function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token') || ''
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

if (typeof window !== 'undefined') {
  const realGet = api.get.bind(api)
  const realPost = api.post.bind(api)
  const realPut = api.put.bind(api)
  const realDelete = api.delete.bind(api)

  api.get = (url, config) =>
    isDemoMode() ? mockApi('get', url, undefined, config) : realGet(url, config)
  api.post = (url, data, config) =>
    isDemoMode()
      ? mockApi('post', url, data, config)
      : realPost(url, data, config)
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
