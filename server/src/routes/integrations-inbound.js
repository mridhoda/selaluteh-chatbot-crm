/**
 * integrations-inbound.js
 *
 * Reverse bridge (Fase 4 Stage E): TATA-POS's backend proxies the Flutter
 * cashier app's Accept/Ready/Complete actions for online orders to this
 * router, HMAC-guarded by tataPosInboundAuth (single static shared secret --
 * see that file's header comment). Distinct from routes/integrations.js,
 * which is an unrelated (OAuth callback / outbound webhook registration)
 * file despite the similar name.
 *
 * :orderId is Online Store's own order id, already stored on the TATA-POS
 * side as sales_orders.external_order_id.
 *
 * Calls the *existing* service functions in order.service.js -- no new
 * business logic. userId is deliberately null: there is no Online Store
 * user behind these calls (the action came from a TATA-POS cashier), and
 * logOrderAudit already treats userId || null as a valid "no actor" case
 * elsewhere in this codebase.
 */
import express from 'express';
import { tataPosInboundAuth } from '../middleware/tataPosInboundAuth.js';
import { ordersRepository } from '../db/repositories/index.js';
import { approveOrder, startPreparing, markReady, completeOrder } from '../services/order.service.js';
import { AppError } from '../utils/errors.js';
import { ORDER_ERRORS } from '../orders/order-types.js';

const router = express.Router();

router.use(tataPosInboundAuth);

function mapBridgeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentStatus: order.fulfillmentStatus,
    paymentStatus: order.paymentStatus,
    outletId: order.outletId,
    workspaceId: order.workspaceId,
    updatedAt: order.updatedAt,
  };
}

async function loadOrderOr404(orderId) {
  const order = await ordersRepository.findByIdAnyWorkspace({ orderId });
  if (!order) throw new AppError(ORDER_ERRORS.ORDER_NOT_FOUND.code, 'Order not found', ORDER_ERRORS.ORDER_NOT_FOUND.status);
  return order;
}

router.post('/orders/:orderId/accept', async (req, res, next) => {
  try {
    const order = await loadOrderOr404(req.params.orderId);
    await approveOrder({ workspaceId: order.workspaceId, orderId: order.id, outletId: order.outletId, userId: null });

    // Chain accept -> preparing in one bridge call: nothing in the existing
    // web UI ever calls the /prepare transition, so markReady would
    // otherwise fail later (it requires 'preparing', not 'accepted').
    try {
      const preparing = await startPreparing({ workspaceId: order.workspaceId, orderId: order.id, outletId: order.outletId, userId: null });
      res.json({ order: mapBridgeOrder(preparing) });
    } catch (chainErr) {
      // The accept itself already succeeded -- make that distinction
      // explicit rather than reporting a generic failure that implies
      // nothing happened.
      chainErr.message = `Order accepted, but auto-transition to preparing failed: ${chainErr.message}`;
      chainErr.details = { ...(chainErr.details || {}), acceptSucceeded: true };
      next(chainErr);
    }
  } catch (err) { next(err); }
});

router.post('/orders/:orderId/ready', async (req, res, next) => {
  try {
    const order = await loadOrderOr404(req.params.orderId);
    const updated = await markReady({ workspaceId: order.workspaceId, orderId: order.id, outletId: order.outletId, userId: null });
    res.json({ order: mapBridgeOrder(updated) });
  } catch (err) { next(err); }
});

router.post('/orders/:orderId/complete', async (req, res, next) => {
  try {
    const order = await loadOrderOr404(req.params.orderId);
    const updated = await completeOrder({ workspaceId: order.workspaceId, orderId: order.id, outletId: order.outletId, userId: null });
    res.json({ order: mapBridgeOrder(updated) });
  } catch (err) { next(err); }
});

export default router;
