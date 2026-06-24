#!/usr/bin/env node
/**
 * sync-stuck-payments.js
 * Manual script: sync all stuck Xendit payments to their actual status.
 * Run from: server/ directory
 * Usage: node scripts/sync-stuck-payments.js
 */
import 'dotenv/config';
import { getSupabaseServiceClient } from '../src/db/supabase.js';
import * as xendit from '../src/integrations/payments/xendit-client.js';
import { env } from '../src/config/env.js';

const client = getSupabaseServiceClient();

async function syncStuckPayments() {
  console.log('🔍 Finding stuck pending payments...\n');

  // Find all pending payments with a Xendit session ID
  const { data: pendingPayments, error } = await client
    .from('payments')
    .select('id, status, order_id, merchant_reference, provider_transaction_id, workspace_id, amount, currency')
    .eq('provider', 'xendit')
    .eq('status', 'pending')
    .not('provider_transaction_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  if (!pendingPayments.length) { console.log('✅ No pending payments found.'); process.exit(0); }

  console.log(`Found ${pendingPayments.length} pending payment(s)\n`);

  let synced = 0;
  let alreadyPaid = 0;
  let stillPending = 0;

  for (const pay of pendingPayments) {
    process.stdout.write(`Payment ${pay.id.slice(0,8)} (${pay.merchant_reference}) → `);
    try {
      const providerResult = await xendit.getPaymentSession(pay.provider_transaction_id);
      const providerStatus = providerResult.status;
      process.stdout.write(`Xendit says: ${providerStatus} `);

      if (providerStatus === 'paid') {
        const now = new Date().toISOString();
        // Update payment
        const { data: updatedPay, error: payErr } = await client
          .from('payments')
          .update({ status: 'paid', paid_at: now, reconciliation_status: 'matched' })
          .eq('id', pay.id)
          .eq('status', 'pending')
          .select()
          .maybeSingle();

        if (payErr) { console.log(`❌ Payment update error: ${payErr.message}`); continue; }
        if (!updatedPay) { console.log('⚠️  Already updated by another process'); alreadyPaid++; continue; }

        // Update order
        const { error: orderErr } = await client
          .from('orders')
          .update({ payment_status: 'paid', paid_at: now, status: 'accepted' })
          .eq('id', pay.order_id);

        if (orderErr) console.log(`⚠️  Order update error: ${orderErr.message}`);

        console.log(`✅ SYNCED → paid`);
        synced++;
      } else if (providerStatus === 'expired') {
        await client.from('payments').update({ status: 'expired' }).eq('id', pay.id).eq('status', 'pending');
        await client.from('orders').update({ payment_status: 'expired' }).eq('id', pay.order_id);
        console.log(`⚠️  expired`);
      } else {
        console.log(`⏳ still ${providerStatus}`);
        stillPending++;
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Synced to paid:   ${synced}`);
  console.log(`  ⏳ Still pending:    ${stillPending}`);
  console.log(`  ⚠️  Already updated: ${alreadyPaid}`);
}

syncStuckPayments().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
