/**
 * Script to clear messages history for a specific chat
 * to reset the chatbot context.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hxeljduldgynligjioff.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4ZWxqZHVsZGd5bmxpZ2ppb2ZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTcxNzczNSwiZXhwIjoyMDk3MjkzNzM1fQ.4MXQo459o3jOVoXULfEnM5FtXaM2jevxX3G9mQTUnR4';

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🧹 Finding chat for customer "mridhoda" / "mridoda"...');
  
  const { data: contacts } = await client
    .from('contacts')
    .select('id, name, external_id')
    .or('name.ilike.%mridhoda%,name.ilike.%mridoda%');

  if (!contacts || contacts.length === 0) {
    console.log('No contacts found.');
    return;
  }

  console.log(`Found ${contacts.length} matching contacts:`);
  for (const contact of contacts) {
    console.log(`- Contact: ${contact.name} (${contact.id}) | External ID: ${contact.external_id}`);
    
    // Find chats for this contact
    const { data: chats } = await client
      .from('chats')
      .select('id, status')
      .eq('contact_id', contact.id);
      
    for (const chat of chats || []) {
      console.log(`  -> Chat ID: ${chat.id} (Status: ${chat.status})`);
      
      // Delete messages
      const { error: delErr, count } = await client
        .from('chat_messages')
        .delete({ count: 'exact' })
        .eq('chat_id', chat.id);
        
      if (delErr) {
        console.error(`     ❌ Failed to delete messages:`, delErr.message);
      } else {
        console.log(`     ✅ Deleted ${count} messages from history.`);
      }

      // Reset chat status
      await client
        .from('chats')
        .update({ status: 'open', is_escalated: false, metadata: { unread: 0 } })
        .eq('id', chat.id);
    }
  }

  console.log('\n🧹 Done! Chat history cleared. You can now type "hi" or "halo" to test from scratch.');
}

main().catch(console.error);
