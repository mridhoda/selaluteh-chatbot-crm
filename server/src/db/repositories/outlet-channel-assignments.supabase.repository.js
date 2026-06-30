import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'outlet_channel_assignments';

export const outletChannelAssignmentsRepository = {
  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId,
      channel_connection_id: data.channelConnectionId,
      status: data.status || 'ACTIVE',
      accepts_chats: data.acceptsChats ?? true,
      accepts_orders: data.acceptsOrders ?? true,
      routing_mode: data.routingMode || 'CUSTOMER_SELECT',
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'outletChannelAssignments.create'));
  },

  async listByConnection({ workspaceId, channelConnectionId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('channel_connection_id', channelConnectionId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'outletChannelAssignments.listByConnection') ?? []);
  },

  async listByWorkspace({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'outletChannelAssignments.listByWorkspace') ?? []);
  },
};
