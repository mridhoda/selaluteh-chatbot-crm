/**
 * complaint.service.js — Supabase-backed
 *
 * Complaint creation from AI flow.
 * Migrated from Mongoose Complaint model to complaintsSupabaseRepository.
 */

import { complaintsSupabaseRepository } from '../db/repositories/index.js';

export async function createComplaintFromAI({ chat, agent, complaintData }) {
  const workspaceId = chat.workspaceId || agent.workspaceId;
  if (!workspaceId) {
    const err = new Error('Workspace is required to create complaint');
    err.status = 400;
    throw err;
  }

  return complaintsSupabaseRepository.create({
    workspaceId,
    outletId: chat.currentOutletId || null,
    chatId: chat.id || null,
    contactId: chat.contactId?.id || chat.contactId || null,
    agentId: agent.id || null,
    subject: complaintData.text || 'No description provided',
    description: complaintData.text || null,
    formData: complaintData.formData || {},
    status: 'open',
  });
}
