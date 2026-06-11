import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, attachUser, async (req, res) => {
  const u = req.me;
  res.json({ id: u._id, name: u.name, email: u.email, role: u.role, status: u.status, plan: u.plan, planExpiry: u.planExpiry });
});

export default router;