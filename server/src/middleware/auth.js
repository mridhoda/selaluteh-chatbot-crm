/**
 * middleware/auth.js — Supabase-backed (task 24.7)
 *
 * JWT verification and user attachment middleware.
 * Resolves user from Supabase users table, not Mongoose.
 *
 * req.me shape (camelCase UserRecord):
 *   id, workspaceId, name, email, role, verified, status,
 *   plan, planExpiry, metadata, createdAt, updatedAt
 *
 * NOTE: req.me.id is a UUID string.
 */

import jwt from 'jsonwebtoken';
import { usersSupabaseRepository } from '../db/repositories/users.repository.js';
import { env } from '../config/env.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Verify Bearer JWT and attach payload to req.user.
 * Does NOT load user from DB — use attachUser for that.
 */
export function authRequired(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Load full user record from Supabase and attach to req.me.
 * Requires authRequired to have run first.
 *
 * req.me is a camelCase UserRecord (id is UUID, not ObjectId).
 */
export async function attachUser(req, res, next) {
  if (!req.user?.id || !UUID_RE.test(req.user.id)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const user = await usersSupabaseRepository.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.me = user;
    next();
  } catch (err) {
    next(err);
  }
}


/**
 * Role-based access guard.
 * Requires attachUser to have run first.
 *
 * @param {...string} roles - allowed roles (e.g. 'owner', 'super', 'agent')
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.me) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.me.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
