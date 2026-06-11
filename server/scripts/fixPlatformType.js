
import mongoose from 'mongoose';
import Chat from '../src/models/Chat.js';
import Platform from '../src/models/Platform.js';
import User from '../src/models/User.js';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI;

const fixPlatformType = async () => {
  try {
    await mongoose.connect(MONGODB_URI);

    // Fix platforms with incorrect type
    await Platform.updateMany({ type: 'whats' }, { $set: { type: 'whatsapp' } });
    console.log('Fixed platforms with incorrect type.');

    // Fix chats with incorrect platformType
    await Chat.updateMany({ platformType: 'whats' }, { $set: { platformType: 'whatsapp' } });
    console.log('Fixed chats with incorrect platformType.');

    const chats = await Chat.find({ $or: [{ platformType: { $in: [null, ''] } }, { workspaceId: { $exists: false } }] }).populate('platformId').populate('userId');

    for (const chat of chats) {
      if (!chat.workspaceId && chat.userId && chat.userId.workspaceId) {
        chat.workspaceId = chat.userId.workspaceId;
        console.log(`Updated chat ${chat._id} with workspaceId: ${chat.workspaceId}`);
      }

      if (chat.platformId && chat.platformId.type) {
        chat.platformType = chat.platformId.type;
        console.log(`Updated chat ${chat._id} with platformType: ${chat.platformType}`);
      }

      if (chat.isModified()) {
        await chat.save();
        console.log(`Saved updated chat ${chat._id}`);
      }
    }

    console.log('Finished updating chats.');
  } catch (error) {
    console.error('Error updating chats:', error);
  } finally {
    mongoose.disconnect();
  }
};

fixPlatformType();
