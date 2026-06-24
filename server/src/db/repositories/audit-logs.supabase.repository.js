import { getSupabaseServiceClient } from '../supabase.js';
import { mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId, applyPagination } from '../supabase-query.js';

const TABLE = 'audit_logs';

export const auditLogsRepository = {
  async log({ workspaceId, outletId, actorId, action, resourceType, resourceId, details, requestId, ipAddress, userAgent }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const payload = {
      workspace_id: workspaceId,
      outlet_id: outletId || null,
      actor_id: actorId || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      details: details || {},
      request_id: requestId || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    };
    const result = await client.from(TABLE).insert(payload).select().single();
    return extractSingle(result, 'audit.log');
  },

  async list({ workspaceId, action, resourceType, resourceId, outletId, actorId, page = 1, limit = 50 }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('*, actor:users(name), outlet:outlets(name)').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (action) q = q.eq('action', action);
    if (resourceType) q = q.eq('resource_type', resourceType);
    if (resourceId) q = q.eq('resource_id', resourceId);
    if (outletId) q = q.eq('outlet_id', outletId);
    if (actorId) q = q.eq('actor_id', actorId);
    q = applyPagination(q, { page, limit });
    return mapRows(extractData(await q, 'audit.list') ?? []);
  },

  async count({ workspaceId, action, resourceType, outletId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client.from(TABLE).select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId);
    if (action) q = q.eq('action', action);
    if (resourceType) q = q.eq('resource_type', resourceType);
    if (outletId) q = q.eq('outlet_id', outletId);
    const result = await q;
    return result.count ?? 0;
  },
};
