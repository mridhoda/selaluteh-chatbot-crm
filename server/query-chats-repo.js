import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

import { chatsSupabaseRepository } from './src/db/repositories/chats.supabase.repository.js';

async function run() {
  const chats = await chatsSupabaseRepository.list({ workspaceId: '60f7c52e-b086-4144-994b-a1260ee00ec9' });
  console.log('Mapped chats sample (first 1):');
  console.log(JSON.stringify(chats[0], null, 2));
}
run();
