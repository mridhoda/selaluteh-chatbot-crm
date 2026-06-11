import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendMail } from '../services/mail.js';

const router = express.Router();

import mongoose from 'mongoose';

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'Email already used' });

  const hash = await bcrypt.hash(password, 10);
  const workspaceId = new mongoose.Types.ObjectId();
  const user = await User.create({ name, email, passwordHash: hash, role: 'owner', verified: false, status: 'offline', workspaceId });

  // generate OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 min
  await OTP.create({ email, code, expiresAt });
  await sendMail({
    to: email,
    subject: 'Kode OTP Verifikasi',
    text: `Kode OTP Anda: ${code}`
  });

  res.json({ ok: true, message: 'Registered, please verify OTP sent to email (or check server console in dev).' });
});

router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  const row = await OTP.findOne({ email }).sort({ createdAt: -1 });
  if (!row) return res.status(400).json({ error: 'OTP not found' });
  if (row.expiresAt < new Date()) return res.status(400).json({ error: 'OTP expired' });
  if (row.code !== code) return res.status(400).json({ error: 'Invalid OTP' });

  await User.updateOne({ email }, { $set: { verified: true } });
  await OTP.deleteMany({ email }); // cleanup
  res.json({ ok: true, message: 'Verified' });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Attempting password reset for email:', email);
  const user = await User.findOne({ email });
  if (user) {
    // Invalidate old tokens
    await PasswordReset.deleteMany({ userId: user._id });

    // Create new token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    await PasswordReset.create({ userId: user._id, token, expiresAt });

    // Send email
    const resetLink = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/reset-password/${token}`;
    try {
      await sendMail({
        to: email,
        subject: 'Password Reset Request',
        text: `Click the link to reset your password: ${resetLink}`,
        html: `<p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
      });
    } catch (mailError) {
      console.error("Failed to send password reset email:", mailError);
      // Don't expose email sending failure to client for security reasons
    }
  }
  // Always return a success message to prevent email enumeration attacks
  res.json({ ok: true, message: 'If an account with that email exists, a password reset link has been sent.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for email:', email);
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

  if (!user.verified) return res.status(400).json({ error: 'Please verify your email' });

  await User.updateOne({ _id: user._id }, { $set: { status: 'online' } });
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
  res.json({
    token,
    user: {
      id: user._id, name: user.name, email: user.email, role: user.role, status: 'online', plan: user.plan, planExpiry: user.planExpiry
    }
  });
});

router.post('/logout', async (req, res) => {
  const { userId } = req.body;
  if (userId) await User.updateOne({ _id: userId }, { $set: { status: 'offline' } });
  res.json({ ok: true });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Missing token or password' });

  const resetRequest = await PasswordReset.findOne({ token });
  if (!resetRequest) return res.status(400).json({ error: 'Invalid or expired token' });

  if (resetRequest.expiresAt < new Date()) {
    await PasswordReset.deleteOne({ _id: resetRequest._id });
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const hash = await bcrypt.hash(password, 10);
  await User.updateOne({ _id: resetRequest.userId }, { $set: { passwordHash: hash } });

  await PasswordReset.deleteOne({ _id: resetRequest._id });

  res.json({ ok: true, message: 'Password has been reset successfully.' });
});

export default router;