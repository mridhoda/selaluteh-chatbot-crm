import mongoose from 'mongoose';

const PlatformSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, required: true }, // whatsapp/telegram/instagram/facebook/custom
  label: { type: String, required: true },
  token: { type: String, default: '' },
  accountId: { type: String, default: '' },
  phoneNumberId: { type: String, default: '' },
  appId: { type: String, default: '' },
  appSecret: { type: String, default: '' },
  webhookSecret: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Platform', PlatformSchema);