import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow } from '../supabase-mapper.js';
import { extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'payment_provider_settings';
const MISSING_RELATION = new Set(['42P01', 'PGRST205']);

function isMissingRelationError(error) {
  return error && MISSING_RELATION.has(error.code);
}

function redactProviderSettings(row) {
  if (!row) return null;
  const mapped = mapRow(row);
  return {
    ...mapped,
    secretKeyCiphertext: undefined,
    webhookSecretCiphertext: undefined,
    secretKeyConfigured: Boolean(mapped.secretKeyCiphertext),
    webhookSecretConfigured: Boolean(mapped.webhookSecretCiphertext),
  };
}

export const paymentProviderSettingsRepository = {
  async findActiveByWorkspace({ workspaceId, mode }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client
      .from(TABLE)
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);
    if (mode) query = query.eq('mode', mode);
    const result = await query.limit(2);
    if (isMissingRelationError(result.error)) return null;
    const rows = result.data || [];
    if (rows.length > 1) {
      const err = new Error('Multiple active payment providers found for workspace/mode');
      err.code = 'PAYMENT_PROVIDER_CONFIG_CONFLICT';
      err.status = 409;
      throw err;
    }
    return redactProviderSettings(rows[0] || null);
  },

  async findActiveProviderSettings({ workspaceId, mode }) {
    return this.findActiveByWorkspace({ workspaceId, mode });
  },

  async listProviderSettings({ workspaceId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE).select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (isMissingRelationError(result.error)) return [];
    if (result.error) throw result.error;
    return (result.data || []).map(redactProviderSettings);
  },

  async findProviderByCode({ workspaceId, code, mode }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from(TABLE).select('*').eq('workspace_id', workspaceId).eq('provider', code);
    if (mode) query = query.eq('mode', mode);
    const result = await query.maybeSingle();
    if (isMissingRelationError(result.error)) return null;
    const row = extractSingle(result, 'paymentProviderSettings.findProviderByCode');
    return redactProviderSettings(row);
  },

  async updateProviderSettings({ workspaceId, providerId, data }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client.from(TABLE)
      .update(data)
      .eq('workspace_id', workspaceId)
      .eq('id', providerId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'paymentProviderSettings.updateProviderSettings');
    return redactProviderSettings(row);
  },

  async disableOtherProviders({ workspaceId, mode, exceptProviderId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let query = client.from(TABLE).update({ is_active: false }).eq('workspace_id', workspaceId);
    if (mode) query = query.eq('mode', mode);
    if (exceptProviderId) query = query.neq('id', exceptProviderId);
    const result = await query.select();
    if (isMissingRelationError(result.error)) return [];
    if (result.error) throw result.error;
    return (result.data || []).map(redactProviderSettings);
  },
};

export const paymentProviderSettingsRepositoryInternals = {
  redactProviderSettings,
};
