/**
 * settings.js — Supabase-backed (task 24.8)
 *
 * Workspace AI settings. Backed by workspace_settings table in Postgres.
 * Replaces Mongoose Setting model.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { openaiClient, geminiClient } from '../services/aiClient.js';
import { getSupabaseServiceClient } from '../db/supabase.js';

const router = express.Router();

const VALID_PROVIDERS = ['openai', 'gemini', 'none'];
const SETTINGS_TABLE = 'workspace_settings';

async function ensureWorkspaceSettings(workspaceId) {
  const client = getSupabaseServiceClient();
  // Upsert default settings row if not exists
  const result = await client
    .from(SETTINGS_TABLE)
    .upsert({ workspace_id: workspaceId }, { onConflict: 'workspace_id', ignoreDuplicates: true })
    .select()
    .maybeSingle();
  if (result.error && !result.data) {
    // Already exists — fetch it
    const fetch = await client.from(SETTINGS_TABLE).select('*').eq('workspace_id', workspaceId).maybeSingle();
    return fetch.data;
  }
  // If upsert returned data use it; otherwise refetch
  if (result.data) return result.data;
  const fetch = await client.from(SETTINGS_TABLE).select('*').eq('workspace_id', workspaceId).single();
  return fetch.data;
}

router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const settings = await ensureWorkspaceSettings(req.me.workspaceId);
    res.json({
      primaryAI: settings?.primary_ai || 'openai',
      secondaryAI: settings?.secondary_ai || 'gemini',
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

    const client = getSupabaseServiceClient();
    await ensureWorkspaceSettings(req.me.workspaceId);

    const { data, error } = await client
      .from(SETTINGS_TABLE)
      .update({ primary_ai: primaryAI, secondary_ai: secondaryAI })
      .eq('workspace_id', req.me.workspaceId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      primaryAI: data.primary_ai,
      secondaryAI: data.secondary_ai,
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
