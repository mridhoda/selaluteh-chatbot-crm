import api from '../../../shared/api/httpClient'

export const chatsApi = {
  list: (params = {}) => api.get('/chats', { params }),
  getMessages: (chatId) => api.get('/chats/' + chatId + '/messages'),
  send: (chatId, payload) => api.post('/chats/' + chatId + '/send', payload),
  takeover: (chatId) => api.post('/chats/' + chatId + '/takeover'),
  resolve: (chatId) => api.post('/chats/' + chatId + '/resolve'),
  delete: (chatId) => api.delete('/chats/' + chatId),
}
