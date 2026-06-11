import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const [, , email, password, nameArg, roleArg] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-user.js <email> <password> [name] [role]');
  process.exit(1);
}

const name = nameArg || email.split('@')[0];
const role = roleArg || 'owner';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

async function main() {
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error(`User already exists: ${email}`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const workspaceId = new mongoose.Types.ObjectId();

  await User.create({
    name,
    email,
    passwordHash,
    role,
    verified: true,
    status: 'offline',
    workspaceId,
  });

  console.log(`Created user ${email} with password ${password} (verified).`);
}

try {
  await main();
} catch (err) {
  console.error(err.message || err);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
