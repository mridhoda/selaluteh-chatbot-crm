/**
 * complaint-escalation.routes.js
 * Spec: auto-escalate-complaints — Task Section 27
 *
 * API contracts:
 *
 *   Settings (workspace default policy):
 *     GET    /api/complaint-escalation/settings
 *     PUT    /api/complaint-escalation/settings
 *     POST   /api/complaint-escalation/settings/validate
 *
 *   Outlet overrides:
 *     GET    /api/complaint-escalation/outlet-overrides
 *     PUT    /api/complaint-escalation/outlets/:outletId/override
 *     DELETE /api/complaint-escalation/outlets/:outletId/override
 *
 *   Escalations on a complaint:
 *     POST   /api/complaints/:complaintId/escalations   (manual escalation)
 *     GET    /api/complaints/:complaintId/escalations
 *
 *   Escalation operations:
 *     GET    /api/escalations
 *     GET    /api/escalations/:escalationId
 *     POST   /api/escalations/:escalationId/acknowledge
 *     POST   /api/escalations/:escalationId/responses
 *     GET    /api/escalations/:escalationId/responses
 *     POST   /api/escalations/:escalationId/complete
 *     POST   /api/escalations/:escalationId/cancel
 *
 *   Diagnostics:
 *     POST   /api/complaints/:complaintId/escalation-evaluation/preview
 *
 * Authorization: enforced via req.me.workspaceId (server-side only).
 * Frontend is NOT an authority for outlet or recipient selection.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import {
  escalationPolicyRepository,
  escalationOverrideRepository,
} from '../services/auto-escalate-complaints/escalation-policy.repository.js';
import {
  escalationRepository,
  escalationResponseRepository,
} from '../services/auto-escalate-complaints/escalation.repository.js';
import {
  createOrFindEscalation,
  acknowledgeEscalation,
  cancelEscalation,
  completeEscalation,
} from '../services/auto-escalate-complaints/escalation-creation.service.js';
import {
  addSupervisorResponse,
  listEscalationResponses,
} from '../services/auto-escalate-complaints/escalation-response.service.js';
import { validatePolicy } from '../services/auto-escalate-complaints/effective-policy.service.js';
import { evaluateComplaintForEscalation } from '../services/auto-escalate-complaints/escalation-evaluator.service.js';
import { ESCALATION_ERROR, TRIGGER_TYPE } from '../services/auto-escalate-complaints/constants.js';

const router = express.Router();
router.use(authRequired, attachUser, attachWorkspaceContext);

// ─── Settings (workspace default policy) ─────────────────────────────────────

router.get('/settings', async (req, res) => {
  try {
    const policy = await escalationPolicyRepository.findByWorkspace({
      workspaceId: req.me.workspaceId,
    });
    res.json({ policy: policy ?? null });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const data = req.body;
    const errors = validatePolicy(data);
    if (errors.length > 0) {
      return res.status(400).json({
        error: { code: ESCALATION_ERROR.POLICY_INVALID, message: errors.join('; ') },
      });
    }

    const policy = await escalationPolicyRepository.upsert({
      workspaceId: req.me.workspaceId,
      data,
    });
    res.json({ policy });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.post('/settings/validate', async (req, res) => {
  const errors = validatePolicy(req.body);
  res.json({ valid: errors.length === 0, errors });
});

// ─── Outlet Overrides ─────────────────────────────────────────────────────────

router.get('/outlet-overrides', async (req, res) => {
  try {
    const overrides = await escalationOverrideRepository.listByWorkspace({
      workspaceId: req.me.workspaceId,
    });
    res.json({ overrides });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.put('/outlets/:outletId/override', async (req, res) => {
  try {
    const override = await escalationOverrideRepository.upsert({
      workspaceId: req.me.workspaceId,
      outletId: req.params.outletId,
      data: req.body,
    });
    res.json({ override });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.delete('/outlets/:outletId/override', async (req, res) => {
  try {
    await escalationOverrideRepository.deleteByOutlet({
      workspaceId: req.me.workspaceId,
      outletId: req.params.outletId,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Escalations list (supervisor queue) ─────────────────────────────────────

router.get('/escalations', async (req, res) => {
  try {
    const { status, outletId, triggerType, limit = 50, offset = 0 } = req.query;
    const outletIds = outletId ? [outletId] : null;
    const result = await escalationRepository.list({
      workspaceId: req.me.workspaceId,
      outletIds,
      status: status || null,
      triggerType: triggerType || null,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/escalations/:escalationId', async (req, res) => {
  try {
    const escalation = await escalationRepository.findById({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
    });
    if (!escalation) {
      return res.status(404).json({ error: { code: ESCALATION_ERROR.PERMISSION_DENIED, message: 'Escalation not found' } });
    }
    res.json({ escalation });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Acknowledge ──────────────────────────────────────────────────────────────

router.post('/escalations/:escalationId/acknowledge', async (req, res) => {
  try {
    const escalation = await acknowledgeEscalation({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
      actorMembershipId: req.body.membershipId ?? null,
      expectedVersion: req.body.version ?? null,
    });
    res.json({ escalation });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Responses ────────────────────────────────────────────────────────────────

router.post('/escalations/:escalationId/responses', async (req, res) => {
  try {
    const response = await addSupervisorResponse({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
      senderMembershipId: req.body.membershipId ?? null,
      responseType: req.body.responseType,
      messageText: req.body.messageText ?? null,
      structuredPayload: req.body.structuredPayload ?? null,
    });
    res.json({ response });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/escalations/:escalationId/responses', async (req, res) => {
  try {
    const responses = await listEscalationResponses({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
    });
    res.json({ responses });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Complete ─────────────────────────────────────────────────────────────────

router.post('/escalations/:escalationId/complete', async (req, res) => {
  try {
    const escalation = await completeEscalation({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
      actorMembershipId: req.body.membershipId ?? null,
      completionReason: req.body.reason ?? null,
      expectedVersion: req.body.version ?? null,
    });
    res.json({ escalation });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Cancel ───────────────────────────────────────────────────────────────────

router.post('/escalations/:escalationId/cancel', async (req, res) => {
  try {
    if (!req.body.reason) {
      return res.status(400).json({
        error: { code: ESCALATION_ERROR.POLICY_INVALID, message: 'Cancellation reason is required' },
      });
    }
    const escalation = await cancelEscalation({
      workspaceId: req.me.workspaceId,
      escalationId: req.params.escalationId,
      actorMembershipId: req.body.membershipId ?? null,
      reason: req.body.reason,
      expectedVersion: req.body.version ?? null,
    });
    res.json({ escalation });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Complaint-scoped escalation endpoints ────────────────────────────────────

router.post('/complaints/:complaintId/escalations', async (req, res) => {
  try {
    const { complaintId } = req.params;
    if (!req.body.reason) {
      return res.status(400).json({
        error: { code: ESCALATION_ERROR.POLICY_INVALID, message: 'Manual escalation requires a reason' },
      });
    }

    const { escalation, evaluationResult } = await createOrFindEscalation({
      workspaceId: req.me.workspaceId,
      complaint: {
        id: complaintId,
        orderId: req.body.orderId ?? null,
        outletId: req.body.outletId ?? null,
        priority: req.body.priority ?? 'medium',
        categoryId: req.body.categoryId ?? null,
        assignedToUserId: req.body.assignedToUserId ?? null,
        createdAt: req.body.createdAt ?? new Date().toISOString(),
        subject: req.body.subject ?? null,
        status: req.body.status ?? null,
      },
      triggerType: TRIGGER_TYPE.MANUAL,
      escalatedByMembershipId: req.body.membershipId ?? null,
      manualReason: req.body.reason,
    });

    res.json({ escalation, evaluationResult });
  } catch (err) {
    const status = err.statusCode ?? err.status ?? 500;
    res.status(status).json({ error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message } });
  }
});

router.get('/complaints/:complaintId/escalations', async (req, res) => {
  try {
    const escalations = await escalationRepository.listByComplaint({
      workspaceId: req.me.workspaceId,
      complaintId: req.params.complaintId,
    });
    res.json({ escalations });
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── Diagnostic: evaluation preview ──────────────────────────────────────────

router.post('/complaints/:complaintId/escalation-evaluation/preview', async (req, res) => {
  try {
    const result = await evaluateComplaintForEscalation({
      workspaceId: req.me.workspaceId,
      complaintId: req.params.complaintId,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
