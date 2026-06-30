/**
 * complaints.js — Supabase-backed
 *
 * Complaint management routes.
 * Migrated from Mongoose Complaint/Chat models to complaintsSupabaseRepository.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { buildOutletScopedQuery } from '../services/access-control.service.js';
import { complaintsSupabaseRepository } from '../db/repositories/index.js';
import { evaluateComplaintForEscalation } from '../services/auto-escalate-complaints/escalation-evaluator.service.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

/**
 * Build a complaint query scope for the current user.
 * Returns { workspaceId, outletId?, outletIds? }
 */
async function buildComplaintTenantQuery(user, outletId) {
  // buildOutletScopedQuery returns { workspaceId, outletId } or { workspaceId, outletIds }
  return buildOutletScopedQuery(user, outletId);
}

function normalizeComplaintBody(body = {}) {
  return {
    contactId: body.contactId || body.contact_id || null,
    chatId: body.chatId || body.chat_id || null,
    agentId: body.agentId || body.agent_id || null,
    platformId: body.platformId || body.platform_id || null,
    outletId: body.outletId || body.outlet_id || null,
    orderId: body.orderId || body.order_id || null,
    channel: body.channel || body.platformType || body.platform_type || null,
    subject: body.subject || body.title || body.text || '',
    description: body.description || body.text || null,
    text: body.text || body.description || body.subject || '',
    status: body.status,
    priority: body.priority,
    formData: body.formData || body.form_data || {},
    metadata: body.metadata || {},
    assignedToUserId: body.assignedToUserId || body.assigned_to_user_id,
    resolutionNotes: body.resolutionNotes || body.resolution_notes,
  };
}

// GET all complaints
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const scope = await buildComplaintTenantQuery(req.me, req.query.outlet_id || req.query.outletId);
    const complaints = await complaintsSupabaseRepository.list({
      workspaceId: scope.workspaceId,
      outletId: scope.outletId || null,
      outletIds: scope.outletIds || null,
      status: status || null,
    });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET complaint detail
router.get('/:id', async (req, res) => {
  try {
    const complaint = await complaintsSupabaseRepository.findById({
      workspaceId: req.me.workspaceId,
      complaintId: req.params.id,
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create complaint
router.post('/', async (req, res) => {
  try {
    const workspaceId = req.me.workspaceId;
    const complaint = await complaintsSupabaseRepository.create({
      ...normalizeComplaintBody(req.body),
      workspaceId,
    });

    // Auto-escalation evaluation — fire-and-forget
    if (complaint?.id) {
      evaluateComplaintForEscalation({ workspaceId, complaintId: complaint.id })
        .catch(err => console.error('[complaints] Auto-escalation on create error:', err?.message));
    }

    res.json(complaint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE complaint
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await complaintsSupabaseRepository.deleteById({
      workspaceId: req.me.workspaceId,
      complaintId: req.params.id,
    });
    if (!deleted) return res.status(404).json({ error: 'Complaint not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function updateComplaint(req, res) {
  try {
    const body = normalizeComplaintBody(req.body);
    const workspaceId = req.me.workspaceId;
    const complaintId = req.params.id;

    const complaint = await complaintsSupabaseRepository.update({
      workspaceId,
      complaintId,
      updates: {
        status: body.status,
        priority: body.priority,
        resolutionNotes: body.resolutionNotes,
        assignedToUserId: body.assignedToUserId,
        formData: req.body.formData ?? req.body.form_data,
        metadata: req.body.metadata,
      },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });

    // Auto-escalation re-evaluation when priority is escalated to HIGH or CRITICAL.
    // Fire-and-forget — never blocks the HTTP response.
    const HIGH_PRIORITIES = ['high', 'critical', 'HIGH', 'CRITICAL'];
    if (body.priority && HIGH_PRIORITIES.includes(body.priority)) {
      evaluateComplaintForEscalation({
        workspaceId,
        complaintId,
        triggerHint: 'AUTO_PRIORITY',
      }).then(({ result }) => {
        if (result && result !== 'NOT_MATCHED' && result !== 'DISABLED' && result !== 'DUPLICATE_ACTIVE_ESCALATION') {
          console.log(`[complaints] Auto-escalation on priority change: ${result} for ${complaintId}`);
        }
      }).catch(err => {
        console.error('[complaints] Auto-escalation on priority change error:', err?.message);
      });
    }

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT/PATCH update status / fields
router.put('/:id', updateComplaint);
router.patch('/:id', updateComplaint);

export default router;
