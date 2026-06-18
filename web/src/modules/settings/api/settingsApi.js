import api from '../../../shared/api/httpClient'
export const settingsApi = {
  get: () => api.get('/settings'),
  updateGeneral: (payload) => api.put('/settings/general', payload),
  updateCommerce: (payload) => api.put('/settings/commerce', payload),
  updatePayment: (payload) => api.put('/settings/payment', payload),
  updateNotifications: (payload) => api.put('/settings/notifications', payload),
  updateAppearance: (payload) => api.put('/settings/appearance', payload),
  testPaymentProvider: (payload) => api.post('/settings/payment/test', payload),
}
