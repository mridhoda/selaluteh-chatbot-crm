import mongoose from 'mongoose';

const PlatformSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  type: { type: String, required: true, enum: ['telegram', 'whatsapp', 'instagram', 'facebook', 'custom'] },
  label: { type: String, required: true },
  token: { type: String, default: '' },
  accountId: { type: String, default: '' },
  phoneNumberId: { type: String, default: '' },
  appId: { type: String, default: '' },
  appSecret: { type: String, default: '' },
  webhookSecret: { type: String, default: '' },
  status: { type: String, enum: ['connected', 'disabled', 'pending_setup', 'needs_attention', 'disconnected'], default: 'pending_setup' },
  health: { type: String, enum: ['healthy', 'no_recent_events', 'verification_failed', 'delivery_errors', 'not_configured'], default: 'not_configured' },
  lastEventAt: { type: Date },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null },
  enabled: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Platform', PlatformSchema);