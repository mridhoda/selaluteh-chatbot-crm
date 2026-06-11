import mongoose from 'mongoose';

const PasswordResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('PasswordReset', PasswordResetSchema);
