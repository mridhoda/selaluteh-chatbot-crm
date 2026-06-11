import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, attachUser, async (req, res) => {
  const plan = req.me.plan || 'pro';
  const expiry = req.me.planExpiry;
  const limits = {
    'free': { maxAgents: 1 },
    'pro': { maxAgents: 5 },
    'pro-banget': { maxAgents: 10 }
  }[plan] || { maxAgents: 1 };

  res.json({ plan, expiry, limits });
});

export default router;