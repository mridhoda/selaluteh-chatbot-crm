import mongoose from 'mongoose';

const UserOutletAccessSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['outlet_manager', 'human_agent', 'viewer'], default: 'viewer' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true },
}, { timestamps: true });

UserOutletAccessSchema.index({ workspaceId: 1, userId: 1, outletId: 1 }, { unique: true });

export default mongoose.model('UserOutletAccess', UserOutletAccessSchema);
