import Complaint from '../models/Complaint.js';

export async function createComplaintFromAI({ chat, agent, complaintData }) {
  const workspaceId = chat.workspaceId || agent.workspaceId;
  if (!workspaceId) {
    const err = new Error('Workspace is required to create complaint');
    err.status = 400;
    throw err;
  }

  return Complaint.create({
    workspaceId,
    outletId: chat.currentOutletId || null,
    chatId: chat._id,
    contactId: chat.contactId,
    agentId: agent._id,
    platformType: chat.platformType,
    text: complaintData.text || 'No description provided',
    formData: complaintData.formData || {},
    status: 'open',
  });
}
