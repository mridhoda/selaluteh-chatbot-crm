import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  variant: { type: String, default: null },
  modifiers: [{ name: String, price: Number }],
}, { _id: false });

const TimelineEntrySchema = new mongoose.Schema({
  type: { type: String, required: true },
  actor: { type: String, default: 'system' },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', default: null, index: true },
  outletNameSnapshot: { type: String, default: '' },
  checkoutId: { type: mongoose.Schema.Types.ObjectId, ref: 'Checkout', default: null },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
  platformType: { type: String, default: 'telegram' },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
  orderNumber: { type: String },
  items: [OrderItemSchema],
  customerSnapshot: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  fulfillmentSnapshot: {
    method: { type: String, default: 'pickup' },
    outletName: { type: String, default: '' },
    outletAddress: { type: String, default: '' },
  },
  totals: {
    subtotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    currency: { type: String, default: 'IDR' },
  },
  status: { type: String, enum: ['new', 'accepted', 'preparing', 'ready', 'completed', 'cancelled'], default: 'new' },
  paymentStatus: { type: String, enum: ['unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded'], default: 'unpaid' },
  fulfillmentStatus: { type: String, enum: ['unfulfilled', 'preparing', 'ready', 'fulfilled', 'cancelled'], default: 'unfulfilled' },
  timeline: [TimelineEntrySchema],
  notes: { type: String, default: '' },
}, { timestamps: true });

OrderSchema.index({ workspaceId: 1, outletId: 1, createdAt: -1 });
OrderSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ workspaceId: 1, paymentStatus: 1, createdAt: -1 });
OrderSchema.index({ workspaceId: 1, orderNumber: 1 }, { unique: true, sparse: true });

export default mongoose.model('Order', OrderSchema);
