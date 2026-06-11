import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';
await mongoose.connect(MONGODB_URI);

const name = 'Owner';
const email = 'owner@example.com';
const password = 'owner123';
const hash = await bcrypt.hash(password, 10);
const workspaceId = new mongoose.Types.ObjectId();

let user = await User.findOne({ email });
if (!user) {
  user = await User.create({ name, email, passwordHash: hash, role: 'owner', verified: true, status: 'offline', workspaceId });
  console.log('Seeded owner user:', email, 'password:', password);
} else {
  console.log('Owner already exists:', email);
}

await mongoose.disconnect();