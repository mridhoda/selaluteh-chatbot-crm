import mongoose from 'mongoose';
import 'dotenv/config';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

async function fix() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/chatbot_crm';
    console.log('Connecting to:', uri);
    await mongoose.connect(uri);

    const email = 'tester@tester.com';
    const newPass = 'tester';
    const hash = await bcrypt.hash(newPass, 10);

    console.log(`Resetting account for ${email}...`);

    // Check if user exists first
    const user = await User.findOne({ email });
    if (!user) {
        console.log('User not found! Creating new owner account...');
        const workspaceId = new mongoose.Types.ObjectId();
        await User.create({
            name: 'Tester',
            email,
            passwordHash: hash,
            role: 'owner',
            verified: true,
            status: 'offline',
            workspaceId
        });
        console.log('User created.');
    } else {
        const res = await User.updateOne(
            { email },
            { $set: { role: 'owner', passwordHash: hash, verified: true } }
        );
        console.log('Update result:', res);
    }

    const updatedUser = await User.findOne({ email });
    console.log('Updated User:', {
        email: updatedUser.email,
        role: updatedUser.role,
        verified: updatedUser.verified
    });

    await mongoose.disconnect();
}

fix();
