import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';

async function check() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_crm';
    console.log('Connecting to:', uri);

    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Found ${users.length} total users:`);

        for (const u of users) {
            console.log('--------------------------------');
            console.log('Email:', u.email);
            console.log('Role:', u.role);
            console.log('Verified:', u.verified);
            console.log('Status:', u.status);
            console.log('WorkspaceId:', u.workspaceId);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

check();
