import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'channel_connections';

function mapConnection(row) {
  return row ? mapRow(row) : null;
}

export const channelConnectionsRepository = {
  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      public_id: data.publicId,
      workspace_id: data.workspaceId,
      provider: data.provider,
      provider_account_id: data.providerAccountId,
      provider_username: data.providerUsername || null,
      display_name: data.displayName || null,
      credential_ciphertext: data.credentialCiphertext,
      credential_key_version: data.credentialKeyVersion,
      credential_fingerprint: data.credentialFingerprint,
      webhook_secret_ciphertext: data.webhookSecretCiphertext,
      webhook_secret_hash: data.webhookSecretHash,
      webhook_secret_version: data.webhookSecretVersion || 1,
      connection_status: data.connectionStatus || 'DRAFT',
      webhook_status: data.webhookStatus || 'NOT_REGISTERED',
      webhook_url: data.webhookUrl || null,
      allowed_updates: data.allowedUpdates || [],
      created_by: data.createdBy || null,
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapConnection(extractSingle(result, 'channelConnections.create'));
  },

  async findActiveByPublicId({ provider, publicId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('provider', provider)
      .eq('public_id', publicId)
      .is('archived_at', null)
      .not('connection_status', 'in', '(DISABLED,REVOKED,ARCHIVED)')
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.findActiveByPublicId'));
  },

  async findById({ workspaceId, connectionId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.findById'));
  },

  async findActiveByProviderAccountId({ provider, providerAccountId }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .is('archived_at', null)
      .not('connection_status', 'in', '(DISABLED,REVOKED,ARCHIVED)')
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.findActiveByProviderAccountId'));
  },

  async listActiveByProvider({ provider }) {
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('provider', provider)
      .is('archived_at', null)
      .not('connection_status', 'in', '(DISABLED,REVOKED,ARCHIVED)')
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'channelConnections.listActiveByProvider') ?? []);
  },

  async listByWorkspaceProvider({ workspaceId, provider }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('provider', provider)
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    return mapRows(extractData(result, 'channelConnections.listByWorkspaceProvider') ?? []);
  },

  async markConnected({ workspaceId, connectionId, webhookUrl, allowedUpdates = [] }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        connection_status: 'CONNECTED',
        webhook_status: 'VERIFIED',
        webhook_url: webhookUrl,
        allowed_updates: allowedUpdates,
        last_webhook_registered_at: new Date().toISOString(),
        last_webhook_verified_at: new Date().toISOString(),
        last_error_code: null,
        last_error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .select()
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.markConnected'));
  },

  async markError({ workspaceId, connectionId, errorCode = 'TELEGRAM_CONNECTION_ERROR', errorMessage = '' }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        connection_status: 'ERROR',
        webhook_status: 'ERROR',
        last_error_code: errorCode,
        last_error_message: String(errorMessage || '').slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .select()
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.markError'));
  },

  async markDegraded({ workspaceId, connectionId, errorCode = 'TELEGRAM_CONNECTION_DEGRADED', errorMessage = '' }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({
        connection_status: 'DEGRADED',
        webhook_status: 'ERROR',
        last_error_code: errorCode,
        last_error_message: String(errorMessage || '').slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .select()
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.markDegraded'));
  },

  async recordInboundReceived({ workspaceId, connectionId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ last_webhook_received_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .select()
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.recordInboundReceived'));
  },

  async recordOutboundSuccess({ workspaceId, connectionId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .update({ last_outbound_success_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('workspace_id', workspaceId)
      .eq('id', connectionId)
      .select()
      .maybeSingle();
    return mapConnection(extractSingle(result, 'channelConnections.recordOutboundSuccess'));
  },
};
