/**
 * Migration via Supabase service role key - add ai_settings column
 * Run: node --env-file=server/.env server/scripts/maintenance/run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Attempting to add ai_settings column to agents table via Supabase...');
  
  // Method: Update a dummy record that will fail, then catch the schema error
  // to verify if column exists. If column doesn't exist, we can't add it via REST.
  
  // First check if column already exists
  const { data, error } = await supabase
    .from('agents')
    .select('ai_settings')
    .limit(1);
  
  if (!error) {
    console.log('✅ Column ai_settings already EXISTS in agents table!');
    console.log('No migration needed.');
    return;
  }
  
  if (error.message.includes('ai_settings')) {
    console.log('❌ Column ai_settings does NOT exist.');
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   Go to: https://supabase.com/dashboard/project/hxeljduldgynligjioff/editor');
    console.log('\nSQL:');
    console.log('─'.repeat(60));
    console.log("ALTER TABLE agents ADD COLUMN IF NOT EXISTS ai_settings JSONB DEFAULT '{}'::jsonb;");
    console.log('─'.repeat(60));
    return;
  }
  
  console.log('Unexpected error:', error.message);
}

run().catch(console.error);
