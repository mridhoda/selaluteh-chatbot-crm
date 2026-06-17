import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectTestDb() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: 'selaluteh_test' });
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
  mongoServer = null;
}

export function objectId() {
  return new mongoose.Types.ObjectId();
}
