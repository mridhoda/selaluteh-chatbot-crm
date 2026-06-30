import express from 'express';
import { env } from '../config/env.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { platformsSupabaseRepository } from '../db/repositories/index.js';
import { providerSyncRateLimit } from '../middleware/rate-limit.js';
import { redactSecrets } from '../utils/redaction.js';

const router = express.Router();

const cleanBaseUrl = (baseUrl = '') => baseUrl.replace(/\/+$/, '');
const isHttpsUrl = (value = '') => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

// Instagram Business Login OAuth redirect target
// This endpoint is used only as a redirect landing page so the
// login flow can complete. You can later extend this to exchange
// the code for tokens and persist them.
router.get('/instagram/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query || {};

    if (error) {
      return res.status(400).send(`Instagram login error: ${error_description || error}`);
    }

    if (!code) {
      return res.status(400).send('Missing authorization code.');
    }

    console.log('[instagram] business login callback received:', redactSecrets({ code, state }));

    // Minimal success page. Replace with a redirect to your web app if needed.
    res.status(200).send(
      '<html><body style="font-family: sans-serif">' +
        '<h2>Instagram connected</h2>' +
        '<p>You can close this window. Code received.</p>' +
      '</body></html>'
    );
  } catch (e) {
    console.error('[instagram] callback error:', e);
    res.status(500).send('Server error processing Instagram callback');
  }
});

router.post('/telegram/:id/setWebhook', authRequired, attachUser, attachWorkspaceContext, providerSyncRateLimit, async (req, res) => {
  try {
    const { id } = req.params;
    const platform = await platformsSupabaseRepository.findByIdWithCredentials({
      workspaceId: req.me.workspaceId,
      platformId: id,
    });

    if (!platform || platform.type !== 'telegram') {
      return res.status(404).json({ error: 'Platform telegram tidak ditemukan' });
    }

    if (!platform.token) {
      return res.status(400).json({ error: 'Token Telegram belum diset' });
    }

    if (!env.publicBaseUrl) {
      return res.status(400).json({ error: 'PUBLIC_BASE_URL belum diset di backend' });
    }

    if (!isHttpsUrl(env.publicBaseUrl)) {
      return res.status(400).json({
        error: 'PUBLIC_BASE_URL untuk Telegram webhook harus HTTPS',
        detail: 'Gunakan domain HTTPS publik, misalnya https://crm-dev.incretlabs.my.id',
      });
    }

    const baseUrl = cleanBaseUrl(env.publicBaseUrl);
    const webhookUrl = `${baseUrl}/webhook/telegram`;

    const response = await fetch(`https://api.telegram.org/bot${platform.token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: true,
        ...(env.telegramWebhookSecret ? { secret_token: env.telegramWebhookSecret } : {}),
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      return res.status(502).json({
        error: 'Gagal set webhook Telegram',
        detail: result,
      });
    }

    // Update webhookConfigured in platforms table
    await platformsSupabaseRepository.update({
      workspaceId: req.me.workspaceId,
      platformId: id,
      updates: { webhookConfigured: true },
    });

    res.json({ ok: true, webhookUrl });
  } catch (error) {
    console.error('[telegram] setWebhook error:', error);
    res.status(500).json({ error: 'Server error saat set webhook Telegram' });
  }
});

export default router;
