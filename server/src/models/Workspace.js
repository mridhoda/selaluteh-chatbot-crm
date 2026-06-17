import mongoose from 'mongoose';

const WorkspaceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

WorkspaceSchema.index({ status: 1, name: 1 });

export default mongoose.model('Workspace', WorkspaceSchema);
