import mongoose from 'mongoose';
import User from './src/models/User.js';
import 'dotenv/config';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

async function changeRole() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const email = 'testeron@tester.com'; // Change this if needed
        const newRole = 'owner'; // or 'super'

        const user = await User.findOneAndUpdate(
            { email },
            { $set: { role: newRole } },
            { new: true }
        );

        if (!user) {
            console.log(`User with email ${email} not found`);
        } else {
            console.log(`✅ Successfully changed role for ${email} to ${newRole}`);
            console.log('User details:', {
                name: user.name,
                email: user.email,
                role: user.role
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

changeRole();
