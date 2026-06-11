import axios from 'axios'

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

export default api
