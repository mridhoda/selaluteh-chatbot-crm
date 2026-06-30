import api from '../../../shared/api/httpClient'

const ESCALATION_API_BASE = '/api/complaint-escalation'
const COMPLAINTS_API_BASE = '/api/complaints'

// ─── Settings ────────────────────────────────────────────────────────────────

export function getEscalationSettings() {
  return api.get(`${ESCALATION_API_BASE}/settings`)
}

export function updateEscalationSettings(payload) {
  return api.put(`${ESCALATION_API_BASE}/settings`, payload)
}

export function validateEscalationSettings(payload) {
  return api.post(`${ESCALATION_API_BASE}/settings/validate`, payload)
}

// ─── Outlet overrides ─────────────────────────────────────────────────────────

export function listOutletOverrides() {
  return api.get(`${ESCALATION_API_BASE}/outlet-overrides`)
}

export function upsertOutletOverride(outletId, payload) {
  return api.put(`${ESCALATION_API_BASE}/outlets/${outletId}/override`, payload)
}

export function deleteOutletOverride(outletId) {
  return api.delete(`${ESCALATION_API_BASE}/outlets/${outletId}/override`)
}

// ─── Escalations (supervisor queue) ──────────────────────────────────────────

export function listEscalations(params = {}) {
  return api.get(`${ESCALATION_API_BASE}/escalations`, { params })
}

export function getEscalation(escalationId) {
  return api.get(`${ESCALATION_API_BASE}/escalations/${escalationId}`)
}

export function acknowledgeEscalation(escalationId, payload = {}) {
  return api.post(`${ESCALATION_API_BASE}/escalations/${escalationId}/acknowledge`, payload)
}

export function completeEscalation(escalationId, payload = {}) {
  return api.post(`${ESCALATION_API_BASE}/escalations/${escalationId}/complete`, payload)
}

export function cancelEscalation(escalationId, payload = {}) {
  return api.post(`${ESCALATION_API_BASE}/escalations/${escalationId}/cancel`, payload)
}

// ─── Responses ────────────────────────────────────────────────────────────────

export function addEscalationResponse(escalationId, payload) {
  return api.post(`${ESCALATION_API_BASE}/escalations/${escalationId}/responses`, payload)
}

export function listEscalationResponses(escalationId) {
  return api.get(`${ESCALATION_API_BASE}/escalations/${escalationId}/responses`)
}

// ─── Complaint-scoped ─────────────────────────────────────────────────────────

export function manualEscalateComplaint(complaintId, payload) {
  return api.post(`${COMPLAINTS_API_BASE}/${complaintId}/escalations`, payload)
}

export function listComplaintEscalations(complaintId) {
  return api.get(`${COMPLAINTS_API_BASE}/${complaintId}/escalations`)
}

// ─── Diagnostic ───────────────────────────────────────────────────────────────

export function previewEscalationEvaluation(complaintId) {
  return api.post(`${COMPLAINTS_API_BASE}/${complaintId}/escalation-evaluation/preview`)
}
