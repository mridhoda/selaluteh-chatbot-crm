import express from 'express';
import { env } from '../../config/env.js';

const router = express.Router();

router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  console.log('[meta-test] verification request received');
  console.log(`hub.mode: ${mode}, hub.verify_token: ${token}`);

  // Fallback to 'selaluteh_sandbox_verify_token' if META_VERIFY_TOKEN is not configured
  const verifyToken = env.metaVerifyToken || 'selaluteh_sandbox_verify_token';

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[meta-test] verification successful, sending challenge');
      res.status(200).send(challenge);
    } else {
      console.warn(`[meta-test] verification failed. Expected: ${verifyToken}, Got: ${token}`);
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

router.post('/', (req, res) => {
  console.log('[meta-test] received webhook:');
  console.log(JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

export default router;
