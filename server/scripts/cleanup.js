import 'dotenv/config';
import mongoose from 'mongoose';
import Chat from '../src/models/Chat.js';
import Message from '../src/models/Message.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

async function cleanup() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Database connected.');

  try {
    // Find all chats that do NOT have a platformId
    const badChats = await Chat.find({ platformId: { $exists: false } });

    if (badChats.length === 0) {
      console.log('No duplicate chats found to clean up.');
      return;
    }

    console.log(`Found ${badChats.length} duplicate chats to remove.`);

    const badChatIds = badChats.map(c => c._id);

    // Delete all messages associated with the bad chats
    console.log(`Deleting messages from ${badChatIds.length} chats...`);
    const messageResult = await Message.deleteMany({ chatId: { $in: badChatIds } });
    console.log(`Deleted ${messageResult.deletedCount} messages.`);

    // Delete the bad chats themselves
    console.log('Deleting duplicate chat documents...');
    const chatResult = await Chat.deleteMany({ _id: { $in: badChatIds } });
    console.log(`Deleted ${chatResult.deletedCount} chats.`);

    console.log('\nCleanup complete!');

  } catch (error) {
    console.error('An error occurred during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

cleanup();
