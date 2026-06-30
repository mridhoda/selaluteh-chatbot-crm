import { Router } from 'express';
import { attachUser, authRequired } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { addRealtimeClient, broadcastToWorkspace, getRealtimeClientCount, sendRealtimeEvent } from '../services/realtime.service.js';
import { env } from '../config/env.js';

const router = Router();

function tokenFromQuery(req, _res, next) {
  const token = req.query?.token;
  if (token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${token}`;
  }
  next();
}

router.get('/orders', tokenFromQuery, authRequired, attachUser, attachWorkspaceContext, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  addRealtimeClient({
    workspaceId: req.me.workspaceId,
    userId: req.me.id,
    allowedOutletIds: req.allowedOutletIds || [],
    res,
  });
  sendRealtimeEvent(res, 'ready', {
    workspaceId: req.me.workspaceId,
    userId: req.me.id,
    connectedAt: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25_000);
  heartbeat.unref?.();

  res.on('close', () => clearInterval(heartbeat));
});

router.get('/health', (_req, res) => {
  res.json({ clients: getRealtimeClientCount() });
});

router.post('/test-order', authRequired, attachUser, attachWorkspaceContext, (req, res) => {
  if (env.isProduction) return res.status(404).json({ error: 'Not found' });

  const orderNumber = req.body?.orderNumber || 'TEST-SSE-ORDER';
  const result = broadcastToWorkspace({
    workspaceId: req.me.workspaceId,
    event: 'order.created',
    data: {
      type: 'order.created',
      workspaceId: req.me.workspaceId,
      outletId: req.body?.outletId || null,
      orderId: `test-order-${Date.now()}`,
      orderNumber,
      title: 'Pesanan baru masuk',
      body: `${orderNumber} dari Customer Test (Outlet Test) - Rp 25.000`,
      order: {
        id: `test-order-${Date.now()}`,
        orderNumber,
        customerNameSnapshot: 'Customer Test',
        outletNameSnapshot: 'Outlet Test',
        totalAmount: 25000,
      },
      createdAt: new Date().toISOString(),
    },
  });

  res.json({ ok: true, ...result });
});

export default router;
