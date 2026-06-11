import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema({
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' }, // optional, if against an agent
    platformType: String,
    text: String, // Description of complaint
    formData: { type: Map, of: String }, // Dynamic fields: { "Nama": "Budi", "Alamat": "Jalan A" }
    status: { type: String, default: 'open', enum: ['open', 'resolved', 'dismissed'] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Complaint', ComplaintSchema);
