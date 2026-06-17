import Contact from '../../models/Contact.js';
import { parsePagination } from '../../utils/pagination.js';
import { normalizePhone } from '../../utils/normalize.js';

export const contactsRepository = {
  list({ workspaceId, search, tags, page, limit, sort }) {
    const query = { workspaceId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
        { platformAccountId: { $regex: search, $options: 'i' } },
      ];
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    const { skip, sort: sortField } = parsePagination({ page, limit, sort });
    const sortObj = {};
    sortObj[sortField.startsWith('-') ? sortField.slice(1) : sortField] = sortField.startsWith('-') ? -1 : 1;
    return Contact.find(query).sort(sortObj).skip(skip).limit(limit).lean();
  },

  count({ workspaceId, search, tags }) {
    const query = { workspaceId };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { handle: { $regex: search, $options: 'i' } },
      ];
    }
    if (tags && tags.length > 0) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }
    return Contact.countDocuments(query);
  },

  findById({ workspaceId, contactId }) {
    return Contact.findOne({ _id: contactId, workspaceId }).lean();
  },

  update({ workspaceId, contactId, updates }) {
    const allowed = ['name', 'handle', 'tags', 'notes', 'lastSeen', 'lastOutletId'];
    const safe = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) safe[key] = updates[key];
    }
    return Contact.findOneAndUpdate(
      { _id: contactId, workspaceId },
      { $set: safe },
      { new: true },
    );
  },

  upsertByProviderIdentity(workspaceId, platformType, platformAccountId, data = {}) {
    const query = { workspaceId, platformType, platformAccountId };
    const update = { $setOnInsert: { workspaceId, platformType, platformAccountId, ...data } };
    if (data.name) update.$set = { ...update.$set, name: data.name };
    if (data.handle) update.$set = { ...update.$set, handle: data.handle };
    if (data.lastSeen) update.$set = { ...update.$set, lastSeen: data.lastSeen };
    return Contact.findOneAndUpdate(query, update, { upsert: true, new: true });
  },

  upsertByPhone(workspaceId, phone) {
    const normalized = normalizePhone(phone);
    if (!normalized) return Promise.resolve(null);
    return Contact.findOneAndUpdate(
      { workspaceId, normalizedPhone: normalized },
      { $setOnInsert: { workspaceId, normalizedPhone: normalized } },
      { upsert: true, new: true },
    );
  },

  setLastOutlet(contactId, outletId) {
    return Contact.findByIdAndUpdate(
      contactId,
      { $set: { lastOutletId: outletId } },
      { new: true },
    );
  },
};
