import Message from '../../models/Message.js';

export const messagesRepository = {
  create(data) {
    return Message.create(data);
  },

  createIfNotExists(workspaceId, platformMessageId, data) {
    if (!platformMessageId) return Message.create(data);
    return Message.findOneAndUpdate(
      { workspaceId, platformMessageId },
      { $setOnInsert: data },
      { upsert: true, new: true },
    );
  },

  findByPlatformId(workspaceId, platformMessageId) {
    return Message.findOne({ workspaceId, platformMessageId });
  },
};
