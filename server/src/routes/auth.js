/**
 * routes/auth.js — Supabase-backed (task 24.7)
 *
 * Custom backend authentication using Supabase/Postgres for user, OTP, and
 * password reset persistence. No Supabase Auth — JWT is issued by this backend.
 *
 * Flow:
 *   POST /auth/register       → create user + workspace + send OTP
 *   POST /auth/verify         → verify OTP → mark user verified
 *   POST /auth/login          → verify password → issue JWT
 *   POST /auth/logout         → set user status offline
 *   POST /auth/forgot-password → create reset token + send email
 *   POST /auth/reset-password  → verify token → update passwordHash
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { usersSupabaseRepository } from '../db/repositories/users.repository.js';
import { workspacesSupabaseRepository } from '../db/repositories/workspaces.repository.js';
import { membershipsSupabaseRepository } from '../db/repositories/memberships.repository.js';
import { authSupabaseRepository } from '../db/repositories/auth.repository.js';
import { sendMail } from '../services/mail.js';
import { env } from '../config/env.js';

const router = express.Router();

/**
 * POST /auth/register
 *
 * Creates a new workspace + owner user atomically (sequential inserts;
 * workspace first so FK is satisfied).
 * Sends OTP for email verification.
 */
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Check duplicate email
    const existing = await usersSupabaseRepository.findByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email already used' });

    // Create workspace first (user FK references workspace)
    const workspace = await workspacesSupabaseRepository.create({
      name: `${name}'s Workspace`,
      status: 'active',
    });

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create owner user
    const user = await usersSupabaseRepository.createUser({
      workspaceId: workspace.id,
      name,
      email,
      passwordHash: hash,
      role: 'owner',
      verified: false,
      status: 'offline',
    });

    // Set workspace owner reference
    await workspacesSupabaseRepository.update(workspace.id, { ownerUserId: user.id });

    // Create workspace membership
    await membershipsSupabaseRepository.createMembership({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
    });

    // Create workspace settings defaults
    await workspacesSupabaseRepository.upsertSettings(workspace.id, {
      businessDisplayName: name,
      timezone: 'Asia/Makassar',
      currency: 'IDR',
      locale: 'id-ID',
    });

    // Generate and send OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes
    await authSupabaseRepository.createOtp({ email, code, expiresAt });

    await sendMail({
      to: email,
      subject: 'Kode OTP Verifikasi',
      text: `Kode OTP Anda: ${code}`,
    });

    res.json({
      ok: true,
      message: 'Registered. Please verify OTP sent to email (or check server console in dev).',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/verify
 *
 * Verify OTP code and mark user as verified.
 */
router.post('/verify', async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Missing email or code' });

    const otp = await authSupabaseRepository.findLatestOtp(email);
    if (!otp) return res.status(400).json({ error: 'OTP not found' });
    if (new Date(otp.expiresAt) < new Date()) return res.status(400).json({ error: 'OTP expired' });
    if (otp.code !== code) return res.status(400).json({ error: 'Invalid OTP' });

    // Mark user verified + cleanup OTPs
    const user = await usersSupabaseRepository.findByEmail(email);
    if (user) await usersSupabaseRepository.setVerified(user.id);
    await authSupabaseRepository.consumeAndCleanOtps(email);

    res.json({ ok: true, message: 'Verified' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/login
 *
 * Authenticate with email + password. Returns a signed JWT.
 * JWT payload: { id, email } — workspaceId resolved at request time via membership.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await usersSupabaseRepository.findByEmail(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    if (!user.verified) return res.status(400).json({ error: 'Please verify your email' });

    await usersSupabaseRepository.setStatus(user.id, 'online');
    await usersSupabaseRepository.updateLastLogin(user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      env.jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'online',
        plan: user.plan,
        planExpiry: user.planExpiry,
        workspaceId: user.workspaceId,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/logout
 *
 * Set user status to offline.
 */
router.post('/logout', async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (userId) await usersSupabaseRepository.setStatus(userId, 'offline');
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/forgot-password
 *
 * Send password reset link. Always returns 200 to prevent email enumeration.
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await usersSupabaseRepository.findByEmail(email);

    if (user) {
      // Invalidate old tokens
      await authSupabaseRepository.deleteResetTokensByUser(user.id);

      // Create new token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
      await authSupabaseRepository.createResetToken({ userId: user.id, token, expiresAt });

      const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${token}`;
      try {
        await sendMail({
          to: email,
          subject: 'Password Reset Request',
          text: `Click the link to reset your password: ${resetLink}`,
          html: `<p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
      } catch (mailErr) {
        console.error('Failed to send password reset email:', mailErr);
        // Don't expose email sending failure to client
      }
    }

    // Always return 200 to prevent email enumeration
    res.json({
      ok: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/reset-password
 *
 * Verify reset token and update password hash.
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });

    const resetRecord = await authSupabaseRepository.findResetToken(token);
    if (!resetRecord) return res.status(400).json({ error: 'Invalid or expired token' });

    if (new Date(resetRecord.expiresAt) < new Date()) {
      await authSupabaseRepository.consumeResetToken(resetRecord.id);
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hash = await bcrypt.hash(password, 10);
    await usersSupabaseRepository.updateUser(resetRecord.userId, { passwordHash: hash });
    await authSupabaseRepository.consumeResetToken(resetRecord.id);

    res.json({ ok: true, message: 'Password has been reset successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;