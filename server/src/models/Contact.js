import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, default: '' },
  platformType: { type: String, default: '' },
  platformAccountId: { type: String, index: true },
  handle: { type: String, default: '' },
  lastSeen: { type: Date },
  tags: [{ type: String }],
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Contact', ContactSchema);