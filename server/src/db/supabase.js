import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let serviceClient;

export function getSupabaseServiceClient() {
  if (!serviceClient) {
    serviceClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serviceClient;
}

export async function connectSupabase() {
  const client = getSupabaseServiceClient();
  const { error } = await client.from('workspaces').select('id').limit(1);
  if (error) throw error;
  return client;
}
