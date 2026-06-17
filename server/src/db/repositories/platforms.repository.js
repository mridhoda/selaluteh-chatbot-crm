import Platform from '../../models/Platform.js';
import { encrypt, decrypt, redact } from '../../utils/encryption.js';

const CREDENTIAL_FIELDS = ['token', 'appSecret', 'webhookSecret'];

export function sanitizePlatform(platform) {
  if (!platform) return null;
  const obj = platform.toObject ? platform.toObject() : { ...platform };
  for (const field of CREDENTIAL_FIELDS) {
    if (obj[field]) {
      obj[field] = obj[field] ? 'configured' : '';
    }
  }
  return obj;
}

export const platformsRepository = {
  async list({ workspaceId }) {
    const rows = await Platform.find({ workspaceId }).sort({ createdAt: -1 }).lean();
    return rows.map(sanitizePlatform);
  },

  async findById({ workspaceId, platformId }) {
    const row = await Platform.findOne({ _id: platformId, workspaceId }).lean();
    return row ? sanitizePlatform(row) : null;
  },

  async findByIdWithCredentials({ workspaceId, platformId }) {
    const row = await Platform.findOne({ _id: platformId, workspaceId });
    if (!row) return null;
    return row.toObject();
  },

  async create({ workspaceId, userId, payload }) {
    const data = { workspaceId, userId, ...payload };
    for (const field of CREDENTIAL_FIELDS) {
      if (data[field]) data[field] = encrypt(data[field]);
    }
    if (!data.status) data.status = 'pending_setup';
    if (!data.health) data.health = 'not_configured';
    const row = await Platform.create(data);
    return sanitizePlatform(row);
  },

  async update({ workspaceId, platformId, updates }) {
    const setFields = {};
    for (const [key, value] of Object.entries(updates)) {
      if (key === '_id' || key === 'workspaceId' || key === 'userId') continue;
      if (CREDENTIAL_FIELDS.includes(key)) {
        setFields[key] = value ? encrypt(value) : '';
      } else {
        setFields[key] = value;
      }
    }
    const row = await Platform.findOneAndUpdate(
      { _id: platformId, workspaceId },
      { $set: setFields },
      { new: true },
    );
    return row ? sanitizePlatform(row) : null;
  },

  async remove({ workspaceId, platformId }) {
    const result = await Platform.deleteOne({ _id: platformId, workspaceId });
    return result.deletedCount > 0;
  },

  async updateHealth({ workspaceId, platformId, health, lastEventAt }) {
    const setFields = { health };
    if (lastEventAt) setFields.lastEventAt = lastEventAt;
    return Platform.findOneAndUpdate(
      { _id: platformId, workspaceId },
      { $set: setFields },
      { new: true },
    );
  },
};
