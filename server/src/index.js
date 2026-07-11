import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import path from 'path';
import { env } from './config/env.js';
import { corsMiddleware } from './config/cors.js';
import { httpLogger } from './config/logger.js';
import { connectSupabase } from './db/supabase.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';
import { authRequired, attachUser } from './middleware/auth.js';
import { attachWorkspaceContext } from './middleware/workspaceContext.js';
import { authorizePermission } from './middleware/authorization.js';
import { isManagedStoredName, resolveFileDownload, resolvePublicManagedFile } from './services/file.service.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import platformRoutes from './routes/platforms.js';
import agentRoutes from './routes/agents.js';
import chatRoutes from './routes/chats.js';
import webhookRoutes from './routes/webhooks/index.js';
import telegramV1WebhookRoutes from './routes/webhooks/telegram-v1.js';
import analyticsRoutes from './routes/analytics.js';
import billingRoutes from './routes/billing.js';
import profileRoutes from './routes/profile.js';
import contactRoutes from './routes/contacts.js';
import integrationsRoutes from './routes/integrations.js';
import complaintRoutes from './routes/complaints.js';
import complaintEscalationRoutes from './routes/complaint-escalation.routes.js';
import orderRoutes from './routes/orders.js';
import adminOrderRoutes from './routes/admin-orders.js';
import adminOnlineStoreRoutes from './routes/admin-online-store.js';
import publicStoreRoutes from './routes/public-store.js';
import outletRoutes from './routes/outlets.js';
import productRoutes from './routes/products.js';
import outletAccessRoutes from './routes/outletAccess.js';
import workspaceRoutes from './routes/workspaces.js';
import membershipRoutes from './routes/memberships.js';
import cartRoutes from './routes/carts.js';
import checkoutRoutes from './routes/checkouts.js';
import paymentRoutes from './routes/payments.js';
import auditRoutes from './routes/audit.js';
import fileRoutes from './routes/files.js';
import workspaceSettingsRoutes from './routes/workspace-settings.js';
import inventoryRoutes from './routes/inventory.js';
import notificationSettingsRoutes from './routes/notification-settings.js';
import pushRoutes from './routes/push.js';
import realtimeRoutes from './routes/realtime.js';
import channelConnectionRoutes from './routes/channel-connections.js';
import createLocationAdminRouter from './routes/location-admin.js';
import createLocationInternalRouter from './routes/location-internal.js';
import { start as startFollowups } from './services/followups.service.js';
import { start as startCartExpiry } from './workers/cart-expiry.worker.js';
import { start as startPaymentReconciliation } from './workers/payment-reconciliation.worker.js';
import { start as startQrSessionExpiry } from './workers/qr-session-expiry.worker.js';
import { createTelegramWebhookManager } from './workers/webhook-manager.worker.js';
import { startEscalationScheduler } from './workers/escalation-scheduler.worker.js';
import { start as startTelegramWebhookEvents } from './workers/telegram-webhook-events.worker.js';

const app = express();
// Do not trust client-supplied forwarding headers; the public rate limiter uses req.ip.
app.set('trust proxy', false);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (env.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(requestId);
app.use(corsMiddleware());
app.use(express.json({
  limit: '2mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(httpLogger());
app.get('/public-files/:storedName', async (req, res, next) => {
  try {
    const storedName = path.basename(req.params.storedName || '');
    if (!storedName || storedName !== req.params.storedName) {
      return res.status(400).json({ error: { code: 'INVALID_FILE_NAME', message: 'Invalid file name' } });
    }
    if (await isManagedStoredName(storedName)) {
      const publicManaged = await resolvePublicManagedFile({ storedName });
      if (!publicManaged) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Managed files require authorization' } });
      return res.sendFile(path.resolve(publicManaged.absolutePath), {
        headers: { 'Content-Type': publicManaged.file.mime_type || 'application/octet-stream' },
      });
    }
    res.sendFile(path.resolve('uploads', storedName));
  } catch (err) {
    next(err);
  }
});
app.get('/files/:storedName', async (req, res, next) => {
  try {
    const storedName = path.basename(req.params.storedName || '');
    if (!storedName || storedName !== req.params.storedName) {
      return res.status(400).json({ error: { code: 'INVALID_FILE_NAME', message: 'Invalid file name' } });
    }
    if (await isManagedStoredName(storedName)) {
      return next('route');
    }
    res.sendFile(path.resolve('uploads', storedName));
  } catch (err) {
    next(err);
  }
});
app.get('/files/:storedName', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'read'), async (req, res, next) => {
  try {
    if (await isManagedStoredName(req.params.storedName)) {
      const { file, absolutePath } = await resolveFileDownload({ workspaceId: req.me.workspaceId, storedName: req.params.storedName });
      res.sendFile(path.resolve(absolutePath), {
        headers: {
          'Content-Type': file.mime_type || 'application/octet-stream',
          'Content-Disposition': `inline; filename="${file.original_name || file.stored_name}"`,
        },
      });
      return;
    }

    const storedName = path.basename(req.params.storedName || '');
    if (!storedName || storedName !== req.params.storedName) {
      return res.status(400).json({ error: { code: 'INVALID_FILE_NAME', message: 'Invalid file name' } });
    }
    res.sendFile(path.resolve('uploads', storedName));
  } catch (err) {
    next(err);
  }
});

app.get('/', (req, res) => {
  res.json({ ok: true, name: 'Chatbot CRM API', version: '1.0.0' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/platforms', platformRoutes);
app.use('/agents', agentRoutes);
app.use('/chats', chatRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/webhooks/telegram/v1', telegramV1WebhookRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/billing', billingRoutes);
app.use('/profile', profileRoutes);
app.use('/contacts', contactRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/complaints', complaintRoutes);
app.use('/orders', orderRoutes);
app.use('/api/v1/admin/orders', adminOrderRoutes);
app.use('/api/v1/admin/online-store', adminOnlineStoreRoutes);
app.use('/api/public', publicStoreRoutes);
app.use('/api/v1/public', publicStoreRoutes);
app.use('/outlets', outletRoutes);
app.use('/products', productRoutes);
app.use('/', outletAccessRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/products', productRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/members', membershipRoutes);
app.use('/carts', cartRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/payments', paymentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/realtime', realtimeRoutes);
app.use('/api/channel-connections', channelConnectionRoutes);
app.use('/api', outletAccessRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/workspaces', workspaceSettingsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api', notificationSettingsRoutes);

// Complaint escalation routes (auto-escalate-complaints spec)
app.use('/api/complaint-escalation', complaintEscalationRoutes);

// Complaint-scoped escalation sub-routes (manual escalation + history)
app.use('/api', complaintEscalationRoutes);

// Location Intelligence routes
app.use('/api/outlets/:outletId/location', createLocationAdminRouter());
app.use('/api/location', createLocationInternalRouter());

app.use(errorHandler);

let server;

async function bootstrap() {
  await connectSupabase();
  console.log('[db] Supabase connected');

  startFollowups();
  startCartExpiry();
  startQrSessionExpiry();
  startPaymentReconciliation();
  startEscalationScheduler();
  startTelegramWebhookEvents({ intervalMs: 1000 });
  const webhookManager = createTelegramWebhookManager();
  webhookManager.start();

  server = app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
    if (env.publicBaseUrl) {
      console.log('Public base URL:', env.publicBaseUrl);
    } else {
      console.log('Tip: set PUBLIC_BASE_URL to your Cloudflare Tunnel URL for webhooks.');
    }
  });

  registerGracefulShutdown(server);
}

function registerGracefulShutdown(server) {
  const shutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Database connect error:', err.message);
  process.exit(1);
});
