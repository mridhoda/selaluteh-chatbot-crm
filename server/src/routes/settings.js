import express from 'express';
import Setting from '../models/Setting.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { openaiClient, geminiClient } from '../services/aiClient.js';

const router = express.Router();

const VALID_PROVIDERS = ['openai', 'gemini', 'none'];

async function ensureSetting(workspaceId) {
  let doc = await Setting.findOne({ workspaceId });
  if (!doc) {
    doc = await Setting.create({
      workspaceId,
      primaryAI: 'openai',
      secondaryAI: 'gemini',
    });
  }
  return doc;
}

router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const setting = await ensureSetting(req.me.workspaceId);
    res.json({
      primaryAI: setting.primaryAI,
      secondaryAI: setting.secondaryAI,
      availableProviders: {
        openai: Boolean(openaiClient),
        gemini: Boolean(geminiClient),
      },
    });
  } catch (err) {
    console.error('GET /settings error:', err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.put('/', authRequired, attachUser, async (req, res) => {
  try {
    const { primaryAI, secondaryAI } = req.body || {};

    if (!VALID_PROVIDERS.includes(primaryAI) || !VALID_PROVIDERS.includes(secondaryAI)) {
      return res.status(400).json({ error: 'Invalid AI provider selection' });
    }

    const doc = await ensureSetting(req.me.workspaceId);
    doc.primaryAI = primaryAI;
    doc.secondaryAI = secondaryAI;
    await doc.save();

    res.json({
      primaryAI: doc.primaryAI,
      secondaryAI: doc.secondaryAI,
      availableProviders: {
        openai: Boolean(openaiClient),
        gemini: Boolean(geminiClient),
      },
    });
  } catch (err) {
    console.error('PUT /settings error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
