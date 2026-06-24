import { getSupabaseServiceClient } from '../db/supabase.js';
import { detectMissingWebhooks } from '../services/payment-reconciliation.service.js';
import { ordersRepository } from '../db/repositories/index.js';
import { sendOrderStatusMessage } from '../services/order.service.js';

const CHECK_INTERVAL_MS = 60_000;
// Only check payments that have been pending for at least this long (avoid checking brand-new ones)
const MIN_PENDING_AGE_MINUTES = 2;

/**
 * Reconcile payments already flagged as 'missing_webhook' — pull from provider and update.
 */
export async function reconcilePayments(workspaceId) {
  const { data } = await detectMissingWebhooks({ workspaceId, limit: 20 });
  if (data.length === 0) return 0;
  const client = getSupabaseServiceClient();

  let reconciled = 0;
  for (const payment of data) {
    try {
      const adapter = await loadPaymentAdapter(payment.provider);
      const result = await adapter.getPayment(payment.providerTransactionId);
      const newStatus = result.status === 'paid' ? 'matched' : 'pending';
      await client.from('payments').update({ reconciliation_status: newStatus }).eq('id', payment.id);
      reconciled++;
    } catch (err) {
      console.error(`[ReconWorker] Payment ${payment.id}: ${err.message}`);
    }
  }
  return reconciled;
}

/**
 * Proactively check pending payments against Xendit API to catch missed webhooks.
 * This is the key fix: if Xendit paid but webhook never arrived (or got stuck),
 * this worker will detect it and update the order automatically.
 */
export async function reconcilePendingPayments(workspaceId) {
  const client = getSupabaseServiceClient();
  const cutoffTime = new Date(Date.now() - MIN_PENDING_AGE_MINUTES * 60 * 1000).toISOString();

  // Find payments that are still 'pending' but old enough to have been paid by now
  const { data: pendingPayments, error } = await client
    .from('payments')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('status', 'pending')
    .eq('provider', 'xendit')
    .not('provider_transaction_id', 'is', null)
    .lt('created_at', cutoffTime)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !pendingPayments?.length) return 0;

  let synced = 0;
  for (const row of pendingPayments) {
    try {
      const adapter = await loadPaymentAdapter(row.provider);
      const providerResult = await adapter.getPayment(row.provider_transaction_id);

      if (providerResult.status === 'paid') {
        // Payment is paid on Xendit side but not in our DB — sync it
        const now = new Date().toISOString();
        const { data: updated } = await client
          .from('payments')
          .update({
            status: 'paid',
            paid_at: now,
            reconciliation_status: 'matched',
          })
          .eq('id', row.id)
          .eq('status', 'pending') // atomic guard
          .select()
          .maybeSingle();

        if (!updated) continue; // another process already updated it

        // Update the order
        const { data: updatedOrder } = await client
          .from('orders')
          .update({
            payment_status: 'paid',
            paid_at: now,
            status: 'accepted',
          })
          .eq('id', row.order_id)
          .select()
          .maybeSingle();

        console.log(`[ReconWorker] Synced missed payment ${row.id} → paid (order ${row.order_id})`);
        synced++;

        // Send notification if order updated
        if (updatedOrder) {
          try {
            const order = await ordersRepository.workspaceFindById({ workspaceId, orderId: updatedOrder.id });
            if (order) {
              const outletLine = order.outletNameSnapshot
                ? `\n\nSilakan ambil di outlet **${order.outletNameSnapshot}** setelah pesanan siap.`
                : '\n\nKami akan memberi tahu saat pesanan siap diambil.';
              await sendOrderStatusMessage({
                order,
                from: 'ai',
                messageText: `Pembayaran pesanan ${order.orderNumber || ''} sudah kami terima ✅\n\nPesanan telah dikonfirmasi dan akan segera diproses.${outletLine}`,
              });
            }
          } catch (notifyErr) {
            console.error(`[ReconWorker] Notification failed for order ${row.order_id}:`, notifyErr.message);
          }
        }
      } else if (providerResult.status === 'expired') {
        // Payment expired on Xendit side — sync expiry
        await client
          .from('payments')
          .update({ status: 'expired', reconciliation_status: 'pending' })
          .eq('id', row.id)
          .eq('status', 'pending');
        await client
          .from('orders')
          .update({ payment_status: 'expired' })
          .eq('id', row.order_id);
      }
    } catch (err) {
      console.error(`[ReconWorker] reconcilePending payment ${row.id}: ${err.message}`);
    }
  }
  return synced;
}

async function loadPaymentAdapter(provider) {
  if (provider === 'xendit') return import('../integrations/payments/xendit-client.js');
  throw new Error(`Unknown provider: ${provider}`);
}

export function start(intervalMs = CHECK_INTERVAL_MS) {
  const timer = setInterval(async () => {
    const client = getSupabaseServiceClient();
    const { data: workspaces } = await client.from('workspaces').select('id').limit(10);
    for (const ws of workspaces ?? []) {
      try {
        // 1. Handle payments flagged as 'missing_webhook'
        const count = await reconcilePayments(ws.id);
        if (count > 0) console.log(`[ReconWorker] Reconciled ${count} missing-webhook payments for workspace ${ws.id}`);

        // 2. Proactively sync pending payments that Xendit may have already settled
        const synced = await reconcilePendingPayments(ws.id);
        if (synced > 0) console.log(`[ReconWorker] Synced ${synced} pending→paid payments for workspace ${ws.id}`);
      } catch (err) {
        console.error(`[ReconWorker] Workspace ${ws.id}: ${err.message}`);
      }
    }
  }, intervalMs).unref();
  return timer;
}
