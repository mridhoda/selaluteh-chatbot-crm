import mongoose from 'mongoose';

const KnowledgeSchema = new mongoose.Schema({
  kind: { type: String, enum: ['url', 'pdf', 'text', 'file', 'qna'], required: true },
  value: { type: String },
  question: { type: String },
  answer: { type: String },
}, { _id: false });

const FollowUpSchema = new mongoose.Schema({
  name: { type: String, required: true },
  trigger: { type: String, required: true },
  prompt: { type: String, required: true },
  delay: { type: Number, required: true }, // in minutes
}, { _id: false });

const DatabaseFileSchema = new mongoose.Schema({
  id: { type: String, required: true },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true },
}, { _id: false });

const AgentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true },
  platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
  prompt: { type: String, default: '' },
  behavior: { type: String, default: '' },
  welcomeMessage: { type: String, default: 'Halo! Ada yang bisa saya bantu?' },
  responseDelay: { type: Number, default: 0 }, // in seconds, 0 = immediate response
  stickerUrl: { type: String },
  knowledge: [KnowledgeSchema],
  followUps: [FollowUpSchema],
  database: [DatabaseFileSchema],
  complaintFields: [{ type: String }], // List of custom fields for complaints
  complaintNotification: {
    enabled: { type: Boolean, default: false },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform' },
    destination: { type: String }, // Phone number or Chat ID
  },
  outlets: [{ type: String }], // Array of outlet names
  salesForms: [{
    name: { type: String, required: true },
    triggerKeywords: [{ type: String }],
    fields: [{ type: String }],
    products: [{
      name: { type: String },
      price: { type: Number },
      description: String
    }],
    isActive: { type: Boolean, default: true }
  }],
  products: [{
    name: { type: String, required: true },
    price: { type: Number, required: true }, // Store as simple number
    description: { type: String },
    inStock: { type: Boolean, default: true }
  }],
  payment: {
    enabled: { type: Boolean, default: false },
    bankInfo: { type: String, default: '' },
    qrisUrl: { type: String, default: '' },
  },
}, { timestamps: true });

export default mongoose.model('Agent', AgentSchema);