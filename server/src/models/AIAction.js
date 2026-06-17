import mongoose from 'mongoose';

const AIActionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', default: null, index: true },
  chatMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null, index: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', default: null, index: true },
  actionType: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['proposed', 'validated', 'executed', 'rejected', 'cancelled', 'failed'],
    default: 'proposed',
    index: true,
  },
  input: { type: Object, default: {} },
  output: { type: Object, default: {} },
  validationErrors: [{ type: String }],
  error: { type: String, default: '' },
  confirmedAt: { type: Date, default: null },
  executedAt: { type: Date, default: null },
}, { timestamps: true });

AIActionSchema.index({ workspaceId: 1, chatId: 1, createdAt: -1 });
AIActionSchema.index({ workspaceId: 1, actionType: 1, status: 1 });

export default mongoose.model('AIAction', AIActionSchema);
