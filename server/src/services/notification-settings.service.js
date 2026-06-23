import { workspacesSupabaseRepository } from '../db/repositories/index.js';
import { AppError } from '../utils/errors.js';
import { isValidNotificationType, isValidNotificationChannel } from './notification.service.js';

const NOTIFICATION_NS = 'notifications';

function getDefaults() {
  return {
    default_channel: 'telegram',
    enabled_types: {
      payment_link: true,
      payment_paid: true,
      order_ready: true,
      order_cancelled: true,
      contact_welcome: false,
      outlet_selection: true,
      product_catalog: true,
      cart_summary: true,
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '07:00',
      timezone: 'Asia/Makassar',
    },
    outlet_recipients: {},
  };
}

function readPrefs(settings) {
  return settings?.metadata?.[NOTIFICATION_NS] ?? getDefaults();
}

export async function getNotificationSettings({ workspaceId }) {
  const settings = await workspacesSupabaseRepository.getSettings(workspaceId);
  if (!settings) {
    return getDefaults();
  }
  return readPrefs(settings);
}

export async function updateNotificationSettings({ workspaceId, updates }) {
  const settings = await workspacesSupabaseRepository.getSettings(workspaceId);
  const current = readPrefs(settings);

  if (updates.default_channel !== undefined) {
    if (!isValidNotificationChannel(updates.default_channel)) {
      throw new AppError('INVALID_CHANNEL', `Invalid notification channel: ${updates.default_channel}`, 400);
    }
    current.default_channel = updates.default_channel;
  }

  if (updates.enabled_types !== undefined) {
    if (typeof updates.enabled_types !== 'object' || Array.isArray(updates.enabled_types)) {
      throw new AppError('VALIDATION', 'enabled_types must be an object', 400);
    }
    for (const [type, enabled] of Object.entries(updates.enabled_types)) {
      if (!isValidNotificationType(type)) {
        throw new AppError('INVALID_NOTIFICATION_TYPE', `Invalid notification type: ${type}`, 400);
      }
      current.enabled_types[type] = Boolean(enabled);
    }
  }

  if (updates.quiet_hours !== undefined) {
    if (typeof updates.quiet_hours !== 'object') {
      throw new AppError('VALIDATION', 'quiet_hours must be an object', 400);
    }
    current.quiet_hours = { ...current.quiet_hours, ...updates.quiet_hours };
  }

  if (updates.outlet_recipients !== undefined) {
    if (typeof updates.outlet_recipients !== 'object' || updates.outlet_recipients === null) {
      throw new AppError('VALIDATION', 'outlet_recipients must be an object', 400);
    }
    current.outlet_recipients = updates.outlet_recipients;
  }

  const metadata = { ...(settings?.metadata ?? {}), [NOTIFICATION_NS]: current };
  await workspacesSupabaseRepository.upsertSettings(workspaceId, { metadata });
  return current;
}

export async function setOutletRecipient({ workspaceId, outletId, telegramChatId = null }) {
  if (telegramChatId !== null && (typeof telegramChatId !== 'string' || !telegramChatId.trim())) {
    throw new AppError('VALIDATION', 'telegramChatId must be a non-empty string or null', 400);
  }

  const settings = await workspacesSupabaseRepository.getSettings(workspaceId);
  const current = readPrefs(settings);

  const recipients = { ...current.outlet_recipients };
  if (telegramChatId === null) {
    delete recipients[outletId];
  } else {
    recipients[outletId] = { telegram_chat_id: telegramChatId };
  }
  current.outlet_recipients = recipients;

  const metadata = { ...(settings?.metadata ?? {}), [NOTIFICATION_NS]: current };
  await workspacesSupabaseRepository.upsertSettings(workspaceId, { metadata });
  return { outletId, telegramChatId };
}

export async function getNotificationTypeEnabled({ workspaceId, type, outletId }) {
  const prefs = await getNotificationSettings({ workspaceId });
  return prefs.enabled_types[type] !== false;
}
