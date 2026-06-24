import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('carts').select('*, cart_items(*)').eq('contact_id', '6cebc96c-68ac-48b9-9590-978109c8ce9f').order('created_at', { ascending: false });
  console.log(JSON.stringify(data, null, 2));
}
run();
