import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', default: null, index: true },
  platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', default: null, index: true },
  provider: { type: String, required: true, index: true },
  eventType: { type: String, default: 'unknown', index: true },
  externalEventId: { type: String, required: true },
  payloadHash: { type: String, required: true },
  payload: { type: Object, default: {} },
  signatureValid: { type: Boolean, default: null },
  status: {
    type: String,
    enum: ['received', 'processing', 'processed', 'ignored_duplicate', 'failed'],
    default: 'received',
    index: true,
  },
  attemptCount: { type: Number, default: 1 },
  error: { type: String, default: '' },
  receivedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

WebhookEventSchema.index(
  { provider: 1, platformId: 1, externalEventId: 1 },
  { unique: true },
);

export default mongoose.model('WebhookEvent', WebhookEventSchema);
