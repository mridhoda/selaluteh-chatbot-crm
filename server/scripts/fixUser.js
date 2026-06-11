
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI;
const USER_EMAIL = 'hitleraniue@gmail.com';

async function fixUser() {
  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for user fix...');

    const user = await User.findOne({ email: USER_EMAIL });

    if (user) {
      if (user.workspaceId) {
        console.log('User already has a workspaceId:', user.workspaceId);
      } else {
        const newWorkspaceId = new mongoose.Types.ObjectId();
        await User.updateOne({ _id: user._id }, { $set: { workspaceId: newWorkspaceId } });
        console.log(`Successfully added new workspaceId ${newWorkspaceId} to user ${USER_EMAIL}`);
      }
    } else {
      console.log(`User with email ${USER_EMAIL} not found.`);
    }

  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

fixUser();
