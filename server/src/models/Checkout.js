import mongoose from 'mongoose';

const CheckoutItemSnapshotSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  variant: { type: String, default: null },
  modifiers: [{ name: String, price: Number }],
}, { _id: false });

const CheckoutSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true, index: true },
  cartId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart', index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', index: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', index: true },
  status: { type: String, enum: ['pending', 'confirmed', 'converted', 'failed', 'expired'], default: 'pending', index: true },
  idempotencyKey: { type: String, index: true },
  items: [CheckoutItemSnapshotSchema],
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  currency: { type: String, default: 'IDR' },
  customerSnapshot: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  fulfillmentSnapshot: {
    method: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
    outletName: { type: String, default: '' },
    outletAddress: { type: String, default: '' },
  },
  expiresAt: { type: Date },
}, { timestamps: true });

CheckoutSchema.index({ workspaceId: 1, idempotencyKey: 1 }, { unique: true, sparse: true });
CheckoutSchema.index({ cartId: 1, status: 1 });
CheckoutSchema.index({ expiresAt: 1 }, { sparse: true });

export default mongoose.model('Checkout', CheckoutSchema);
