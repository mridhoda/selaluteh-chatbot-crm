import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  from: { type: String, enum: ['user', 'ai', 'human'], required: true },
  text: { type: String, required: true },
  attachment: {
    url: { type: String },
    filename: { type: String },
  },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  platformMessageId: { type: String, default: null }, // Store platform-specific message ID (e.g., Telegram message_id)
}, { timestamps: true });

export default mongoose.model('Message', MessageSchema);