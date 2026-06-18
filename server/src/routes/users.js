/**
 * routes/users.js — Supabase-backed (task 24.7)
 *
 * User management API for workspace owner/admin.
 * Uses usersSupabaseRepository (Supabase-backed).
 *
 * REMOVED: /fix-my-account and /find-by-email diagnostic routes
 * Supabase-backed user management routes.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { usersSupabaseRepository } from '../db/repositories/users.repository.js';
import { membershipsSupabaseRepository } from '../db/repositories/memberships.repository.js';
import { authRequired, attachUser, requireRole } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

/**
 * GET /users
 *
 * List all users in the requesting user's workspace.
 * Returns camelCase user objects (passwordHash excluded by the repository).
 */
router.get('/', authRequired, attachUser, async (req, res, next) => {
  try {
    const users = await usersSupabaseRepository.findByWorkspace(req.me.workspaceId);
    // Strip passwordHash from response
    const safe = users.map(({ passwordHash: _, ...u }) => u);
    res.json(safe);
  } catch (err) { next(err); }
});

/**
 * POST /users/human
 *
 * Create a new human agent user for this workspace.
 * Requires owner or super role.
 */
router.post('/human', authRequired, attachUser, requireRole('owner', 'super'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const r = ['agent', 'super'].includes(role) ? role : 'agent';

    const exists = await usersSupabaseRepository.findByEmail(email);
    if (exists) return res.status(400).json({ error: 'Email already used' });

    const hash = await bcrypt.hash(password, 10);
    const user = await usersSupabaseRepository.createUser({
      workspaceId: req.me.workspaceId,
      name,
      email,
      passwordHash: hash,
      role: r,
      verified: true,
      status: 'offline',
    });

    // Create workspace membership for the new user
    await membershipsSupabaseRepository.createMembership({
      workspaceId: req.me.workspaceId,
      userId: user.id,
      role: r === 'super' ? 'admin' : 'human_agent',
      status: 'active',
    });

    res.json({ ok: true, id: user.id });
  } catch (err) { next(err); }
});

/**
 * DELETE /users/:id
 *
 * Delete a user from the workspace.
 * Cannot delete yourself.
 * Requires owner or super role.
 */
router.delete('/:id', authRequired, attachUser, requireRole('owner', 'super'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.me.id === id) {
      return res.status(400).json({ error: 'You cannot delete yourself.' });
    }

    const targetUser = await usersSupabaseRepository.findById(id);
    if (!targetUser || targetUser.workspaceId !== req.me.workspaceId) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Soft-disable membership instead of hard delete (preserves audit trail)
    await membershipsSupabaseRepository.disableMembership({
      userId: id,
      workspaceId: req.me.workspaceId,
    });

    // Hard delete the user record
    const client = (await import('../db/supabase.js')).getSupabaseServiceClient();
    await client.from('users').delete().eq('id', id).eq('workspace_id', req.me.workspaceId);

    res.status(200).json({ ok: true, message: 'User deleted successfully.' });
  } catch (err) { next(err); }
});

export default router;
