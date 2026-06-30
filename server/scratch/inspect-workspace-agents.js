import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== WORKSPACES ===");
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('*');
  if (wsError) console.error(wsError);
  else console.log(workspaces);

  console.log("\n=== AGENTS ===");
  const { data: agents, error: agError } = await supabase.from('agents').select('*');
  if (agError) console.error(agError);
  else console.log(agents);

  console.log("\n=== CHANNEL CONNECTIONS ===");
  const { data: channelConnections, error: connError } = await supabase.from('channel_connections').select('*');
  if (connError) console.error(connError);
  else console.log(channelConnections);

  console.log("\n=== USERS ===");
  const { data: users, error: userError } = await supabase.from('users').select('*');
  if (userError) console.error(userError);
  else console.log(users);

  console.log("\n=== WORKSPACE MEMBERSHIPS ===");
  const { data: memberships, error: memError } = await supabase.from('workspace_memberships').select('*');
  if (memError) console.error(memError);
  else console.log(memberships);
}

run();
