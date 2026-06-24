import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  await supabase.from('orders').update({ source: 'whatsapp' }).eq('order_number', 'SLTH-20260624-0013');
  console.log('Fixed #SLTH-20260624-0013');
}
run();
