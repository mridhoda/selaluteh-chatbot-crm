import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', index: true },
  platformType: { type: String, default: '' },
  unread: { type: Number, default: 0 },
  lastMessageAt: { type: Date, default: Date.now },
  takeoverBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // human takeover
  isEscalated: { type: Boolean, default: false }, // AI escalated to human
  status: { type: String, default: 'open', enum: ['open', 'resolved'] },
  state: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model('Chat', ChatSchema);