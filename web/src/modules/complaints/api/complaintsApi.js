import api from '../../../shared/api/httpClient'

export function listComplaints(params = {}) {
  return api.get('/complaints', { params })
}

export function getComplaint(id) {
  return api.get(`/complaints/${id}`)
}

export function createComplaint(payload) {
  return api.post('/complaints', payload)
}

export function updateComplaint(id, payload) {
  return api.put(`/complaints/${id}`, payload)
}

export function deleteComplaint(id) {
  return api.delete(`/complaints/${id}`)
}
