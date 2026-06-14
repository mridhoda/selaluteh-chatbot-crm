import api from '../../../shared/api/httpClient'

// Backend routes needed:
//   GET    /products
//   POST   /products
//   GET    /products/:id
//   PUT    /products/:id
//   PATCH  /products/:id/archive
//   PATCH  /products/:id/restore
//   PUT    /products/:id/outlets/:outletId

export const productsApi = {
  list: (params = {}) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  archive: (id) => api.patch(`/products/${id}/archive`),
  restore: (id) => api.patch(`/products/${id}/restore`),
  updateOutletAvailability: (productId, outletId, payload) =>
    api.put(`/products/${productId}/outlets/${outletId}`, payload),
}
