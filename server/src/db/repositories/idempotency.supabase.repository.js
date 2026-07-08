import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';
import { withRepositoryTx } from './repository-contract.js';

const TABLE = 'order_idempotency_records';
const DEFAULT_COMMAND_TYPE = 'public_checkout';

function isMissingColumnError(error) {
  return error?.code === 'PGRST204' || /column .* does not exist/i.test(String(error?.message || ''));
}

function mapMaybeSingle(result, label) {
  const row = extractSingle(result, label);
  return row ? mapRow(row) : null;
}

const baseRepository = {
  async findByKey({ workspaceId, key, commandType = DEFAULT_COMMAND_TYPE }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('command_type', commandType)
      .eq('idempotency_key', key)
      .maybeSingle();
    const row = extractSingle(result, 'idempotency.findByKey');
    return row ? mapRow(row) : null;
  },

  async findByKeyForUpdate({ workspaceId, key, commandType = DEFAULT_COMMAND_TYPE }) {
    // Supabase JS cannot issue SELECT FOR UPDATE directly; transaction-aware callers
    // should use this method through an RPC/pg transaction in a later hardening pass.
    return this.findByKey({ workspaceId, key, commandType });
  },

  async createProcessingKey({ workspaceId, key, requestHash, commandType = DEFAULT_COMMAND_TYPE, expiresAt }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insertPayload = {
      workspace_id: workspaceId,
      command_type: commandType,
      idempotency_key: key,
      request_hash: requestHash,
      status: 'processing',
      response_snapshot: null,
      error_snapshot: null,
      resource_id: null,
      expires_at: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    let result = await client.from(TABLE).insert(insertPayload).select().single();
    if (result.error && result.error.code === '23505') return this.findByKey({ workspaceId, key, commandType });
    if (result.error && isMissingColumnError(result.error)) {
      const { status, error_snapshot: errorSnapshot, ...legacyPayload } = insertPayload;
      result = await client.from(TABLE).insert(legacyPayload).select().single();
      if (result.error && result.error.code === '23505') return this.findByKey({ workspaceId, key, commandType });
    }
    return mapRow(extractSingle(result, 'idempotency.createProcessingKey'));
  },

  async claimProcessing({ workspaceId, key, requestHash, commandType = DEFAULT_COMMAND_TYPE, expiresAt }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const insertPayload = {
      workspace_id: workspaceId,
      command_type: commandType,
      idempotency_key: key,
      request_hash: requestHash,
      status: 'processing',
      response_snapshot: null,
      error_snapshot: null,
      resource_id: null,
      expires_at: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    let result = await client.from(TABLE).insert(insertPayload).select().single();
    if (result.error && result.error.code === '23505') {
      return { record: await this.findByKey({ workspaceId, key, commandType }), claimed: false };
    }
    if (result.error && isMissingColumnError(result.error)) {
      const { status, error_snapshot: errorSnapshot, ...legacyPayload } = insertPayload;
      result = await client.from(TABLE).insert(legacyPayload).select().single();
      if (result.error && result.error.code === '23505') {
        return { record: await this.findByKey({ workspaceId, key, commandType }), claimed: false };
      }
    }
    return { record: mapRow(extractSingle(result, 'idempotency.claimProcessing')), claimed: true };
  },

  async markCompleted({ workspaceId, key, responseJson, resourceId, commandType = DEFAULT_COMMAND_TYPE }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const updates = {
      status: 'completed',
      resource_id: resourceId || null,
      response_snapshot: responseJson || null,
      error_snapshot: null,
    };
    let result = await client.from(TABLE)
      .update(updates)
      .eq('workspace_id', workspaceId)
      .eq('command_type', commandType)
      .eq('idempotency_key', key)
      .select()
      .maybeSingle();
    if (result.error && isMissingColumnError(result.error)) {
      const { status, error_snapshot: errorSnapshot, ...legacyUpdates } = updates;
      result = await client.from(TABLE)
        .update(legacyUpdates)
        .eq('workspace_id', workspaceId)
        .eq('command_type', commandType)
        .eq('idempotency_key', key)
        .select()
        .maybeSingle();
    }
    return mapMaybeSingle(result, 'idempotency.markCompleted');
  },

  async markFailed({ workspaceId, key, errorJson, resourceId, commandType = DEFAULT_COMMAND_TYPE }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const existing = await this.findByKey({ workspaceId, key, commandType });
    if (!existing) return null;
    const updates = {
      status: 'failed',
      resource_id: resourceId || existing.resourceId || null,
      error_snapshot: errorJson || null,
    };
    let result = await client.from(TABLE)
      .update(updates)
      .eq('workspace_id', workspaceId)
      .eq('command_type', commandType)
      .eq('idempotency_key', key)
      .select()
      .maybeSingle();
    if (result.error && isMissingColumnError(result.error)) {
      const { status, error_snapshot: errorSnapshot, ...legacyUpdates } = updates;
      result = await client.from(TABLE)
        .update(legacyUpdates)
        .eq('workspace_id', workspaceId)
        .eq('command_type', commandType)
        .eq('idempotency_key', key)
        .select()
        .maybeSingle();
    }
    return mapMaybeSingle(result, 'idempotency.markFailed');
  },

  async storeCompleted({ workspaceId, key, requestHash, responseJson, resourceId, commandType = DEFAULT_COMMAND_TYPE, expiresAt }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).insert({
      workspace_id: workspaceId,
      command_type: commandType,
      idempotency_key: key,
      request_hash: requestHash,
      resource_id: resourceId || null,
      response_snapshot: responseJson || null,
      expires_at: expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }).select().maybeSingle();
    if (result.error && result.error.code === '23505') return this.findByKey({ workspaceId, key, commandType });
    const row = extractSingle(result, 'idempotency.storeCompleted');
    return row ? mapRow(row) : null;
  },
};

export const idempotencyRepository = withRepositoryTx(baseRepository);
