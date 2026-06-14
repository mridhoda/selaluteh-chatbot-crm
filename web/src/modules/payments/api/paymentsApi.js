import api from '../../../shared/api/httpClient'
// Backend routes needed: GET /payments, GET /payments/:id, GET /payments/:id/events, POST /payments/:id/resend-link, POST /orders/:orderId/payment-link
export const paymentsApi = {
  list: (params = {}) => api.get('/payments', { params }),
  get: (id) => api.get(`/payments/${id}`),
  getEvents: (id) => api.get(`/payments/${id}/events`),
  resendLink: (id) => api.post(`/payments/${id}/resend-link`),
  createOrderPaymentLink: (orderId) => api.post(`/orders/${orderId}/payment-link`),
}
