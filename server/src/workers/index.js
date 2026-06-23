export { startNotificationWorker, stopNotificationWorker, processPendingNotifications } from './notification.worker.js';
export { start as startCartExpiry } from './cart-expiry.worker.js';
export { start as startCheckoutCleanup } from './checkout-cleanup.worker.js';
export { start as startPaymentReconciliation } from './payment-reconciliation.worker.js';

const timers = {};

export function startWorkers(options = {}) {
  const { enableCartExpiry = true, enableCheckoutCleanup = true, enablePaymentRecon = false, enableNotifications = false } = options;

  if (enableCartExpiry) timers.cartExpiry = startCartExpiry();
  if (enableCheckoutCleanup) timers.checkoutCleanup = startCheckoutCleanup();
  if (enablePaymentRecon) timers.paymentRecon = startPaymentReconciliation();
  if (enableNotifications) timers.notifications = startNotificationWorker();

  // ─── In-process limitations (22.9) ──────────────────────────────────────
  // Workers run as setInterval callbacks inside the main Node process.
  // Jobs may be lost on crash or ungraceful shutdown because there is no
  // durable queue backing (Redis/BullMQ). This is acceptable for single-
  // instance MVP. Before multi-instance production or critical job delivery,
  // upgrade to a durable queue (22.10). All timers use .unref() so they
  // do not prevent process exit.
}

export function stopWorkers() {
  for (const [name, timer] of Object.entries(timers)) {
    if (timer) {
      clearInterval(timer);
      delete timers[name];
    }
  }
}
