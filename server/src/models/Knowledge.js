import mongoose from 'mongoose';

const KnowledgeSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true, unique: true },
  mimetype: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model('Knowledge', KnowledgeSchema);
