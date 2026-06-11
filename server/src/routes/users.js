import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authRequired, attachUser, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List human agents
router.get('/', authRequired, attachUser, async (req, res) => {
  const users = await User.find({ workspaceId: req.me.workspaceId }, 'name email role status createdAt').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/human', authRequired, attachUser, requireRole('owner','super'), async (req, res) => {
  const { name, email, password, role } = req.body; // role: 'agent' or 'super'
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  const r = ['agent','super'].includes(role) ? role : 'agent';
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ error: 'Email already used' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hash, role: r, verified: true, status: 'offline', workspaceId: req.me.workspaceId });
  res.json({ ok: true, id: user._id });
});

// Delete human agent
router.delete('/:id', authRequired, attachUser, requireRole('owner', 'super'), async (req, res) => {
  const { id } = req.params;
  // Prevent user from deleting themselves
  if (req.me.id === id) {
    return res.status(400).json({ error: 'You cannot delete yourself.' });
  }
  try {
    const deletedUser = await User.findOneAndDelete({ _id: id, workspaceId: req.me.workspaceId });
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ ok: true, message: 'User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during user deletion.' });
  }
});

// TEMP: Fix user account missing workspaceId
router.get('/fix-my-account', async (req, res) => {
  const userEmail = 'hitleraniue@gmail.com';
  try {
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.workspaceId) {
      return res.json({ message: 'Account already has a workspaceId.', workspaceId: user.workspaceId });
    }
    const newWorkspaceId = new mongoose.Types.ObjectId();
    user.workspaceId = newWorkspaceId;
    await user.save();
    res.json({ message: `Successfully added workspaceId to ${userEmail}.`, workspaceId: newWorkspaceId });
  } catch (error) {
    console.error('[FIX-ACCOUNT] Error:', error);
    res.status(500).json({ error: 'An error occurred during the fix.' });
  }
});

// DIAGNOSTIC: Find user by email
router.get('/find-by-email', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Please provide an email query parameter.' });
  }
  try {
    console.log(`[DIAGNOSTIC] Searching for user with email: ${email}`);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: `User with email ${email} not found.` });
    }
    res.json(user);
  } catch (error) {
    console.error('[DIAGNOSTIC] Error:', error);
    res.status(500).json({ error: 'An error occurred during the search.' });
  }
});

export default router;