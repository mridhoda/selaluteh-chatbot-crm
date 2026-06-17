import mongoose from 'mongoose';
import Chat from './src/models/Chat.js';
import Contact from './src/models/Contact.js';
import Platform from './src/models/Platform.js';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

async function inspectChat() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const chatId = '6921210301e8f84a1a580c81';
        const chat = await Chat.findById(chatId).populate('contactId').populate('platformId');

        if (!chat) {
            console.log('Chat not found');
        } else {
            console.log('Chat Details:');
            console.log(JSON.stringify(chat, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

inspectChat();
