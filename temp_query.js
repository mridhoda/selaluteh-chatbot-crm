import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('complaints').select('*, order:orders(id, platform)').order('created_at', {ascending: false}).limit(5);
  console.log(JSON.stringify(data, null, 2));
}
run();
