import mongoose from 'mongoose';

const OutletSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true, uppercase: true },
  city: { type: String, default: '' },
  region: { type: String, default: '' },
  address: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  phone: { type: String, default: '' },
  managerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active', index: true },
  timezone: { type: String, default: 'Asia/Makassar' },
  openingHours: { type: Object, default: {} },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

OutletSchema.index({ workspaceId: 1, code: 1 }, { unique: true, sparse: true });
OutletSchema.index({ workspaceId: 1, status: 1 });

export default mongoose.model('Outlet', OutletSchema);
