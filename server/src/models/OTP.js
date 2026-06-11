import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  code: { type: String, required: true }, // simple, dev-friendly
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto-clean after expires

export default mongoose.model('OTP', OTPSchema);