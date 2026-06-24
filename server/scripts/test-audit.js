import 'dotenv/config';
import { getSupabaseServiceClient } from '../src/db/supabase.js';

async function main() {
  try {
    const client = getSupabaseServiceClient();
    const { data, error } = await client.from('audit_logs').select('id').limit(1);
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log('Successfully queried audit_logs! Table exists. Data:', data);
    }
  } catch (err) {
    console.error('Failed to run test:', err);
  }
}
main();
