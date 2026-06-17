import mongoose from 'mongoose';

const CartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  effectivePrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  variant: { type: String, default: null },
  modifiers: [{ name: String, price: Number }],
  subtotal: { type: Number, required: true },
}, { _id: false });

const CartSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', index: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
  platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
  platformType: { type: String, default: '' },
  items: [CartItemSchema],
  total: { type: Number, default: 0 },
  currency: { type: String, default: 'IDR' },
  status: { type: String, enum: ['active', 'converted', 'expired', 'cancelled'], default: 'active', index: true },
  expiresAt: { type: Date, index: true },
}, { timestamps: true });

CartSchema.index({ workspaceId: 1, contactId: 1, status: 1, outletId: 1 });
CartSchema.index({ workspaceId: 1, chatId: 1, status: 1 });

export default mongoose.model('Cart', CartSchema);
