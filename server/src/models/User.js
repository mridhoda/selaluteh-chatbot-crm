import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['owner','super','agent'], default: 'owner' },
  verified: { type: Boolean, default: false },
  status: { type: String, enum: ['online','offline'], default: 'offline' },
  plan: { type: String, enum: ['free','pro','pro-banget'], default: 'pro' },
  planExpiry: { type: Date, default: () => new Date(Date.now() + 1000*60*60*24*30) }, // 30 hari
}, { timestamps: true });

export default mongoose.model('User', UserSchema);