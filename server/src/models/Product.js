import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true, index: true },
  sku: { type: String, trim: true },
  shortDescription: { type: String, default: '' },
  description: { type: String, default: '' },
  basePrice: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, default: null },
  currency: { type: String, default: 'IDR' },
  thumbnailFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  thumbnailUrl: { type: String, default: '' },
  tags: [{ type: String }],
  taxRate: { type: Number, default: null },
  taxLabel: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  stockTracking: { type: Boolean, default: false },
  stockQuantity: { type: Number, default: null },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

ProductSchema.index({ workspaceId: 1, slug: 1 }, { unique: true, sparse: true });
ProductSchema.index({ workspaceId: 1, isActive: 1 });

export default mongoose.model('Product', ProductSchema);
