import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Platform from '../src/models/Platform.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGODB_URI);
const platforms = await Platform.find({ type: 'instagram' });
console.log(
  platforms.map((p) => ({
    id: p._id.toString(),
    accountId: p.accountId,
    name: p.name,
    workspaceId: p.workspaceId.toString(),
    userId: p.userId.toString(),
  })),
);
await mongoose.disconnect();
