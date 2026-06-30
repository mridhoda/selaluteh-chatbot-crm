/**
 * complaint.service.js — Supabase-backed
 *
 * Complaint creation from AI flow.
 * Migrated from Mongoose Complaint model to complaintsSupabaseRepository.
 */

import {
  complaintsSupabaseRepository,
  ordersSupabaseRepository,
  outletsSupabaseRepository,
} from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';
import { evaluateComplaintForEscalation } from './auto-escalate-complaints/escalation-evaluator.service.js';

function normalizeLookup(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function findOutletMatch(outlets = [], outletText = '') {
  const normalizedText = normalizeLookup(outletText);
  if (!normalizedText) return null;

  return outlets.find((outlet) => {
    const name = normalizeLookup(outlet.name);
    const code = normalizeLookup(outlet.code);
    return name === normalizedText || code === normalizedText;
  }) || null;
}

function resolveId(value) {
  if (!value) return null;
  if (typeof value === 'object') return value.id || null;
  return value;
}

async function validateAndResolveComplaintLinks({ workspaceId, complaintData, chat }) {
  const formData = complaintData.formData || {};
  const orderNumber = formData.orderNumber || complaintData.orderNumber;
  const outletText = formData.outlet || complaintData.outlet;
  const chatContactId = resolveId(chat?.contactId);

  let resolvedOrder = null;
  let resolvedOutlet = null;

  if (orderNumber) {
    resolvedOrder = await ordersSupabaseRepository.workspaceFindByOrderNumber({ workspaceId, orderNumber });
    if (!resolvedOrder) {
      throw new AppError('COMPLAINT_ORDER_NOT_FOUND', `Order not found for complaint: ${orderNumber}`, 400, { orderNumber });
    }
    if (chatContactId && resolveId(resolvedOrder.contactId) !== chatContactId) {
      throw new AppError('COMPLAINT_ORDER_CONTACT_MISMATCH', 'Complaint order belongs to a different customer', 403, {
        orderNumber,
        chatContactId,
        orderContactId: resolveId(resolvedOrder.contactId),
      });
    }
  }

  if (outletText) {
    const activeOutlets = await outletsSupabaseRepository.findActiveByWorkspace(workspaceId);
    resolvedOutlet = findOutletMatch(activeOutlets, outletText);
    if (!resolvedOutlet) {
      throw new AppError('COMPLAINT_OUTLET_NOT_FOUND', `Outlet not found for complaint: ${outletText}`, 400, { outlet: outletText });
    }
  }

  if (resolvedOrder && resolvedOutlet && resolvedOrder.outletId !== resolvedOutlet.id) {
    throw new AppError('COMPLAINT_ORDER_OUTLET_MISMATCH', 'Complaint order belongs to a different outlet', 409, {
      orderNumber,
      claimedOutlet: outletText,
      orderOutletId: resolvedOrder.outletId,
      matchedOutletId: resolvedOutlet.id,
    });
  }

  if (resolvedOrder && !resolvedOutlet) resolvedOutlet = resolvedOrder.outlet || null;

  return { resolvedOrder, resolvedOutlet };
}

export async function createComplaintFromAI({ chat, agent, complaintData }) {
  const workspaceId = chat.workspaceId || agent.workspaceId;
  if (!workspaceId) {
    const err = new Error('Workspace is required to create complaint');
    err.status = 400;
    throw err;
  }

  // validateAndResolveComplaintLinks uses resolvedOrder/resolvedOutlet in scope
  const { resolvedOrder, resolvedOutlet } = await validateAndResolveComplaintLinks({
    workspaceId,
    complaintData,
    chat,
  });

  const platformId = chat?.platformId || chat?.platforms?.id || resolvedOrder?.platformId || null;
  const channel = chat?.platform || chat?.platforms?.type || resolvedOrder?.source || null;

  const complaint = await complaintsSupabaseRepository.create({
    workspaceId,
    outletId: resolvedOutlet?.id || resolvedOrder?.outletId || chat.currentOutletId || null,
    chatId: chat.id || null,
    contactId: chat.contactId?.id || chat.contactId || null,
    agentId: agent.id || null,
    orderId: resolvedOrder?.id || null,
    platformId,
    channel,
    subject: complaintData.subject || complaintData.text || 'No description provided',
    description: complaintData.description || complaintData.text || null,
    priority: complaintData.priority || 'medium',
    formData: {
      ...(complaintData.formData || {}),
      orderValidation: resolvedOrder ? 'matched' : 'not_provided',
      outletValidation: resolvedOutlet ? 'matched' : 'not_provided',
    },
    metadata: {
      ...(complaintData.metadata || {}),
      resolvedOrderNumber: resolvedOrder?.orderNumber || null,
      resolvedOutletName: resolvedOutlet?.name || null,
    },
    status: 'open',
  });

  // Auto-escalation evaluation — fire-and-forget.
  // Runs asynchronously; a failure here never surfaces to the customer.
  if (complaint?.id) {
    evaluateComplaintForEscalation({
      workspaceId,
      complaintId: complaint.id,
    }).then(({ result }) => {
      if (result && result !== 'NOT_MATCHED' && result !== 'DISABLED') {
        console.log(`[complaint] Auto-escalation: ${result} for complaint ${complaint.id}`);
      }
    }).catch(err => {
      console.error('[complaint] Auto-escalation evaluation error:', err?.message);
    });
  }

  return complaint;
}
