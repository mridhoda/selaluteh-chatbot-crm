import mongoose from 'mongoose';

const ProductOutletAvailabilitySchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, default: null },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  isAvailable: { type: Boolean, default: true, index: true },
  priceOverride: { type: Number, default: null },
  stockQuantity: { type: Number, default: null },
  status: { type: String, enum: ['active', 'inactive', 'sold_out', 'available', 'unavailable'], default: 'active', index: true },
  availableFrom: { type: Date, default: null },
  availableUntil: { type: Date, default: null },
  soldOutReason: { type: String, default: '' },
}, { timestamps: true });

ProductOutletAvailabilitySchema.index(
  { workspaceId: 1, productId: 1, variantId: 1, outletId: 1 },
  { unique: true },
);
ProductOutletAvailabilitySchema.index({ workspaceId: 1, outletId: 1, status: 1, isAvailable: 1 });

export default mongoose.model('ProductOutletAvailability', ProductOutletAvailabilitySchema);
