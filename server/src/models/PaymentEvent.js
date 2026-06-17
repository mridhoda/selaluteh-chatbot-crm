import mongoose from 'mongoose';

const PaymentEventSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  provider: { type: String },
  providerEventId: { type: String, unique: true, sparse: true },
  eventType: { type: String },
  status: { type: String },
  amount: { type: Number },
  currency: { type: String, default: 'IDR' },
  feeAmount: { type: Number },
  netAmount: { type: Number },
  paymentMethod: { type: String },
  processingStatus: { type: String, enum: ['received', 'verified', 'processed', 'rejected', 'failed'], default: 'received' },
  verificationResult: { type: String },
  raw: { type: Object },
  receivedAt: { type: Date, default: Date.now },
}, { timestamps: true });

PaymentEventSchema.index({ paymentId: 1, receivedAt: -1 });
PaymentEventSchema.index({ orderId: 1, receivedAt: -1 });
PaymentEventSchema.index({ processingStatus: 1 });

export default mongoose.model('PaymentEvent', PaymentEventSchema);
