import mongoose from 'mongoose';

const UserWorkspaceMembershipSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { type: String, enum: ['owner', 'admin', 'outlet_manager', 'human_agent', 'viewer'], default: 'human_agent' },
  status: { type: String, enum: ['active', 'invited', 'disabled'], default: 'active', index: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

UserWorkspaceMembershipSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });
UserWorkspaceMembershipSchema.index({ workspaceId: 1, role: 1 });
UserWorkspaceMembershipSchema.index({ status: 1, userId: 1 });

export default mongoose.model('UserWorkspaceMembership', UserWorkspaceMembershipSchema);
