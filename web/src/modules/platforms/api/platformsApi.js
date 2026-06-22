import api from '../../../shared/api/httpClient'

export const platformsApi = {
  list: () => api.get('/platforms'),
  get: (id) => api.get('/platforms/' + id),
  create: (payload) => api.post('/platforms', payload),
  update: (id, payload) => api.put('/platforms/' + id, payload),
  delete: (id) => api.delete('/platforms/' + id),
  setTelegramWebhook: (id) =>
    api.post('/integrations/telegram/' + id + '/setWebhook'),
  // Graceful degradation - these may 404 if not implemented:
  test: (id) => api.post('/platforms/' + id + '/test'),
  health: (id) => api.get('/platforms/' + id + '/health').catch(() => null),
}
