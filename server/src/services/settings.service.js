import { workspacesSupabaseRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';
import { decrypt, encrypt } from '../utils/encryption.js';

const SETTINGS_NS = 'app_settings';
const SECRET_FLAG_SUFFIX = '_configured';
const ENCRYPTED_PREFIX = 'enc:';

export const SETTINGS_SCHEMAS = {
  general: { keys: ['business_display_name', 'timezone', 'currency', 'locale', 'default_language'] },
  commerce: { keys: ['ai_commerce_enabled', 'require_checkout_confirmation', 'human_handoff_enabled'] },
  notifications: { keys: ['default_channel', 'enabled_types', 'quiet_hours', 'outlet_recipients'] },
  ai: { keys: ['primary_ai', 'secondary_ai', 'default_model', 'custom_provider_url', 'custom_provider_key'] },
  payment: { keys: ['provider', 'xendit_mode', 'environment', 'merchant_id', 'public_key', 'payment_methods', 'xendit_secret_key', 'xendit_webhook_token', 'doku_client_id', 'doku_secret_key'] },
  security: { keys: ['allow_all_outlets_view'] },
};

export function listSchemas() {
  return Object.keys(SETTINGS_SCHEMAS);
}

export function getSchemaKeys(category) {
  const schema = SETTINGS_SCHEMAS[category];
  if (!schema) throw new AppError('INVALID_SCHEMA', `Unknown settings schema: ${category}`, 400);
  return schema.keys;
}

export function isSecretKey(key) {
  return key.includes('secret') || key.includes('key') || key.includes('token') || key === 'custom_provider_key' || key === 'doku_client_id';
}

export function secretConfiguredKey(key) {
  return key + SECRET_FLAG_SUFFIX;
}

function encryptSecret(value) {
  if (!value) return '';
  const raw = String(value);
  if (raw.startsWith(ENCRYPTED_PREFIX)) return raw;
  return `${ENCRYPTED_PREFIX}${encrypt(raw)}`;
}

function decryptSecret(value) {
  if (!value) return '';
  const raw = String(value);
  if (!raw.startsWith(ENCRYPTED_PREFIX)) return raw;
  return decrypt(raw.slice(ENCRYPTED_PREFIX.length));
}

function isTopLevelColumn(key) {
  return ['business_display_name', 'timezone', 'currency', 'locale', 'default_language',
    'ai_commerce_enabled', 'require_checkout_confirmation', 'human_handoff_enabled',
    'allow_all_outlets_view', 'primary_ai', 'secondary_ai'].includes(key);
}

const COLUMN_MAP = {
  business_display_name: 'business_display_name',
  default_language: 'default_language',
  ai_commerce_enabled: 'ai_commerce_enabled',
  require_checkout_confirmation: 'require_checkout_confirmation',
  human_handoff_enabled: 'human_handoff_enabled',
  allow_all_outlets_view: 'allow_all_outlets_view',
  primary_ai: 'primary_ai',
  secondary_ai: 'secondary_ai',
};

async function getDbSettings(workspaceId) {
  const settings = await workspacesSupabaseRepository.getSettings(workspaceId);
  return settings;
}

export async function getEffectiveSettings({ workspaceId, category }) {
  const schema = SETTINGS_SCHEMAS[category];
  if (!schema) throw new AppError('INVALID_SCHEMA', `Unknown settings schema: ${category}`, 400);

  const db = await getDbSettings(workspaceId);
  const metadata = db?.metadata ?? {};
  const ns = metadata[SETTINGS_NS] ?? {};
  const result = {};

  for (const key of schema.keys) {
    if (isTopLevelColumn(key)) {
      const mapped = COLUMN_MAP[key];
      result[key] = db?.[mapped] ?? null;
    } else {
      result[key] = ns[key] ?? null;
    }

    if (isSecretKey(key) && result[key] !== null && result[key] !== '') {
      result[secretConfiguredKey(key)] = true;
      result[key] = null;
    } else if (isSecretKey(key)) {
      result[secretConfiguredKey(key)] = false;
    }
  }

  return result;
}

export async function updateCategorySettings({ workspaceId, category, updates }) {
  const schema = SETTINGS_SCHEMAS[category];
  if (!schema) throw new AppError('INVALID_SCHEMA', `Unknown settings schema: ${category}`, 400);

  const db = await getDbSettings(workspaceId);
  const metadata = { ...(db?.metadata ?? {}) };
  const ns = { ...(metadata[SETTINGS_NS] ?? {}) };
  const topLevelUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    if (!schema.keys.includes(key)) {
      throw new AppError('INVALID_SETTING_KEY', `Setting "${key}" is not valid for category "${category}"`, 400);
    }
    if (isTopLevelColumn(key)) {
      const mapped = COLUMN_MAP[key];
      topLevelUpdates[mapped] = value;
    } else {
      if (isSecretKey(key) && value !== null && value !== undefined) {
        ns[key] = value === '' ? '' : encryptSecret(value);
      } else if (!isSecretKey(key)) {
        ns[key] = value;
      }
    }
  }

  metadata[SETTINGS_NS] = ns;
  await workspacesSupabaseRepository.upsertSettings(workspaceId, { metadata, ...topLevelUpdates });

  return getEffectiveSettings({ workspaceId, category });
}

export async function getPaymentRuntimeConfig({ workspaceId }) {
  const db = await getDbSettings(workspaceId);
  const metadata = db?.metadata ?? {};
  const ns = metadata[SETTINGS_NS] ?? {};
  const provider = ns.provider || 'manual';
  const environment = ns.environment || ns.xendit_mode || 'test';
  const paymentMethods = Array.isArray(ns.payment_methods) ? ns.payment_methods : [];

  return {
    provider,
    environment,
    paymentMethods,
    configured: provider === 'doku'
      ? Boolean(ns.doku_client_id && ns.doku_secret_key)
      : provider === 'xendit'
        ? Boolean(ns.xendit_secret_key)
        : provider === 'manual',
    doku: {
      clientId: decryptSecret(ns.doku_client_id),
      secretKey: decryptSecret(ns.doku_secret_key),
      apiBaseUrl: environment === 'production' ? 'https://api.doku.com' : 'https://api-sandbox.doku.com',
      paymentTtlMinutes: 60,
      paymentMethods,
    },
    xendit: {
      secretKey: decryptSecret(ns.xendit_secret_key),
      webhookToken: decryptSecret(ns.xendit_webhook_token),
    },
  };
}
