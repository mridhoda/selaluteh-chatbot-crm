import { getSupabaseServiceClient } from '../db/supabase.js';

export async function validateDataConsistency({ workspaceId } = {}) {
  const client = getSupabaseServiceClient();
  const issues = [];

  if (workspaceId) {
    const { data: orders } = await client.from('orders').select('id, outlet_id').eq('workspace_id', workspaceId);
    const outletIds = [...new Set(orders?.map(o => o.outlet_id) ?? [])];
    if (outletIds.length > 0) {
      const { count } = await client.from('outlets').select('id', { count: 'exact', head: true }).in('id', outletIds).eq('workspace_id', workspaceId);
      if (count !== outletIds.length) {
        issues.push({ type: 'workspace_outlet_mismatch', detail: `Orders reference ${outletIds.length} outlets but only ${count} exist` });
      }
    }
  }

  return issues;
}

export async function validateAllWorkspaces() {
  const client = getSupabaseServiceClient();
  const { data: workspaces } = await client.from('workspaces').select('id').limit(50);
  const allIssues = [];
  for (const ws of workspaces ?? []) {
    const issues = await validateDataConsistency({ workspaceId: ws.id });
    allIssues.push(...issues.map(i => ({ workspaceId: ws.id, ...i })));
  }
  return allIssues;
}
