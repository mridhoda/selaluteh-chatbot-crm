import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectMongo(uri = env.mongoUri) {
  await mongoose.connect(uri);
  return mongoose.connection;
}
