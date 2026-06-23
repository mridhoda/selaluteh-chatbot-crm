import { getSupabaseServiceClient } from '../db/supabase.js';
import { detectMissingWebhooks } from '../services/payment-reconciliation.service.js';

const CHECK_INTERVAL_MS = 60_000;

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
        const count = await reconcilePayments(ws.id);
        if (count > 0) console.log(`[ReconWorker] Reconciled ${count} payments for workspace ${ws.id}`);
      } catch (err) {
        console.error(`[ReconWorker] Workspace ${ws.id}: ${err.message}`);
      }
    }
  }, intervalMs).unref();
  return timer;
}
