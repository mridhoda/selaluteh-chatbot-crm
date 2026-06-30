/**
 * Script to create/escalate a test complaint for "Selalu Teh - 3 Sukarame"
 * and verify direct outlet manager phone notification (WA: 6282253120241).
 * Includes a sleep delay at the end to allow async tasks to complete before process exit.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { evaluateComplaintForEscalation } from '../src/services/auto-escalate-complaints/escalation-evaluator.service.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hxeljduldgynligjioff.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWxqZHVsZGd5bmxpZ2ppb2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcxNzczNSwiZXhwIjoyMDk3MjkzNzM1fQ.4MXQo459o3jOVoXULfEnM5FtXaM2jevxX3G9mQTUnR4';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🏁 Starting direct manager phone auto-escalation integration test...');

  // 1. Get Sukarame Outlet details
  const { data: SukarameOutlet } = await client
    .from('outlets')
    .select('id, name, workspace_id, phone, metadata')
    .ilike('name', '%Sukarame%')
    .single();

  if (!SukarameOutlet) {
    console.error('❌ Sukarame outlet not found!');
    process.exit(1);
  }
  console.log(`📍 Sukarame Outlet: ${SukarameOutlet.name} (${SukarameOutlet.id})`);

  // Ensure primary supervisor is null to test fallback
  await client
    .from('outlets')
    .update({ primary_supervisor_user_id: null })
    .eq('id', SukarameOutlet.id);

  // 2. Locate Rian Bintang contact
  const { data: rianContact } = await client
    .from('contacts')
    .select('id, name, external_id')
    .eq('workspace_id', SukarameOutlet.workspace_id)
    .eq('external_id', '6282253120241')
    .maybeSingle();

  if (rianContact) {
    console.log(`✅ Found Rian Bintang Contact: ${rianContact.name} (${rianContact.external_id})`);
  }

  // 3. Create the test complaint
  console.log('📝 Creating test complaint under Sukarame...');
  const now = new Date().toISOString();
  const { data: complaint, error: createErr } = await client
    .from('complaints')
    .insert({
      workspace_id: SukarameOutlet.workspace_id,
      outlet_id: SukarameOutlet.id,
      contact_id: rianContact ? rianContact.id : null,
      subject: '[TEST ESCALATION DIRECT] Salah Produk di Sukarame',
      description: 'Pelanggan memesan Teh Asli 2, tetapi yang diterima adalah Teh Tarik Vanilla 2. Customer sudah meninggalkan lokasi.',
      status: 'open',
      priority: 'high',
      channel: 'whatsapp',
      form_data: {
        orderNumber: 'SLTH-SUKARAME-TEST-3',
        outlet: SukarameOutlet.name,
        issue: 'Pesan Teh Asli 2, terima Teh Tarik Vanilla 2 (Direct Phone Test)',
        location: 'Sudah pulang',
        source: 'manual_test',
      },
      metadata: {
        createdByTest: true,
        testTimestamp: now,
      },
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (createErr) {
    console.error('❌ Failed to create test complaint:', createErr);
    process.exit(1);
  }
  console.log(`✅ Test complaint created! ID: ${complaint.id}`);

  // 4. Evaluate and trigger auto-escalation
  console.log('🚨 Running evaluateComplaintForEscalation to trigger direct phone WA notification...');
  const result = await evaluateComplaintForEscalation({
    workspaceId: SukarameOutlet.workspace_id,
    complaintId: complaint.id,
  });

  console.log('\n📊 Evaluation Result:', JSON.stringify(result, null, 2));
  
  console.log('\n⏳ Waiting 5 seconds for async notifications to send...');
  await sleep(5000);
  
  console.log('\n🎉 Finished! Please verify if Rian Bintang (WA: 082253120241 / 6282253120241) received the notification message.');
}

main().then(() => process.exit(0)).catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
