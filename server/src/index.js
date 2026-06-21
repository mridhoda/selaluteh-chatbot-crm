import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import { env } from './config/env.js';
import { corsMiddleware } from './config/cors.js';
import { httpLogger } from './config/logger.js';
import { connectSupabase } from './db/supabase.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestId } from './middleware/request-id.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import platformRoutes from './routes/platforms.js';
import agentRoutes from './routes/agents.js';
import chatRoutes from './routes/chats.js';
import webhookRoutes from './routes/webhooks/index.js';
import analyticsRoutes from './routes/analytics.js';
import billingRoutes from './routes/billing.js';
import profileRoutes from './routes/profile.js';
import contactRoutes from './routes/contacts.js';
import integrationsRoutes from './routes/integrations.js';
import complaintRoutes from './routes/complaints.js';
import orderRoutes from './routes/orders.js';
import outletRoutes from './routes/outlets.js';
import productRoutes from './routes/products.js';
import outletAccessRoutes from './routes/outletAccess.js';
import workspaceRoutes from './routes/workspaces.js';
import membershipRoutes from './routes/memberships.js';
import cartRoutes from './routes/carts.js';
import checkoutRoutes from './routes/checkouts.js';
import paymentRoutes from './routes/payments.js';
import createLocationAdminRouter from './routes/location-admin.js';
import createLocationInternalRouter from './routes/location-internal.js';
import { start as startFollowups } from './services/followups.service.js';
import { start as startCartExpiry } from './workers/cart-expiry.worker.js';
import { createTelegramWebhookManager } from './workers/webhook-manager.worker.js';

const app = express();
app.set('trust proxy', 1);

app.use(requestId);
app.use(corsMiddleware());
app.use(express.json({ limit: '2mb' }));
app.use(httpLogger());
app.use('/files', express.static('uploads'));

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
app.use('/analytics', analyticsRoutes);
app.use('/billing', billingRoutes);
app.use('/profile', profileRoutes);
app.use('/contacts', contactRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/complaints', complaintRoutes);
app.use('/orders', orderRoutes);
app.use('/outlets', outletRoutes);
app.use('/products', productRoutes);
app.use('/', outletAccessRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/products', productRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/workspaces/:workspaceId/members', membershipRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api', outletAccessRoutes);

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
