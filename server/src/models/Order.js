import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
    formName: { type: String, required: true },
    formData: { type: Object, default: {} }, // Captured fields: { "Product": "A", "Qty": "1" }
    status: { type: String, enum: ['new', 'processed', 'completed', 'cancelled'], default: 'new' },
    notes: { type: String },
    paymentProofUrl: { type: String } // URL to payment proof image
}, { timestamps: true });

export default mongoose.model('Order', OrderSchema);
