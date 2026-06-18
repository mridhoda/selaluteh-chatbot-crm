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

// POST create complaint
router.post('/', async (req, res) => {
  try {
    const complaint = await complaintsSupabaseRepository.create({
      ...req.body,
      workspaceId: req.me.workspaceId,
      outletId: req.body.outletId || req.body.outlet_id || null,
    });
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

// PUT update status / fields
router.put('/:id', async (req, res) => {
  try {
    const { status, priority, resolutionNotes } = req.body;
    const complaint = await complaintsSupabaseRepository.update({
      workspaceId: req.me.workspaceId,
      complaintId: req.params.id,
      updates: { status, priority, resolutionNotes },
    });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
