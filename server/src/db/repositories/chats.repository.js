import Chat from '../../models/Chat.js';

export const chatsRepository = {
  findWorkspaceChatIds(workspaceId) {
    return Chat.find({ workspaceId }).select('_id');
  },

  findByIdWithPlatformAndContact(chatId) {
    return Chat.findById(chatId).populate('platformId').populate('contactId');
  },

  markInboundActivity(chatId) {
    return Chat.updateOne(
      { _id: chatId },
      {
        $set: {
          lastMessageAt: new Date(),
          status: 'open',
          isEscalated: false,
        },
        $inc: { unread: 1 },
      },
    );
  },

  setCurrentOutlet(chatId, outletId) {
    return Chat.findByIdAndUpdate(
      chatId,
      { $set: { currentOutletId: outletId } },
      { new: true },
    );
  },
};
