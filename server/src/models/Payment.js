import mongoose from 'mongoose';

const PaymentEventSchema = new mongoose.Schema({
  providerEventId: { type: String },
  eventType: { type: String },
  status: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'IDR' },
  feeAmount: { type: Number },
  netAmount: { type: Number },
  paymentMethod: { type: String },
  paidAt: { type: Date },
  raw: { type: Object },
}, { _id: false, timestamps: true });

const PaymentSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  outletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  attemptNumber: { type: Number, default: 1 },
  provider: { type: String, enum: ['midtrans', 'xendit', 'manual'], default: 'manual' },
  providerTransactionId: { type: String },
  merchantReference: { type: String },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'], default: 'pending', index: true },
  reconciliationStatus: { type: String, enum: ['pending', 'matched', 'missing_webhook', 'unmatched', 'amount_mismatch', 'duplicate', 'provider_paid_order_pending'], default: 'pending' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'IDR' },
  feeAmount: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  grossAmount: { type: Number, default: 0 },
  paymentUrl: { type: String },
  paymentMethod: { type: String },
  customerSnapshot: { name: String, email: String, phone: String },
  expiresAt: { type: Date },
  paidAt: { type: Date },
  events: [PaymentEventSchema],
}, { timestamps: true });

PaymentSchema.index({ workspaceId: 1, createdAt: -1 });
PaymentSchema.index({ workspaceId: 1, outletId: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1, attemptNumber: -1 });
PaymentSchema.index({ providerTransactionId: 1 }, { sparse: true });
PaymentSchema.index({ merchantReference: 1 }, { sparse: true });
PaymentSchema.index({ reconciliationStatus: 1 });

export default mongoose.model('Payment', PaymentSchema);
