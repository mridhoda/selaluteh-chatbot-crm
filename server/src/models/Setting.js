import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      unique: true,
    },
    primaryAI: {
      type: String,
      enum: ['openai', 'gemini', 'none'],
      default: 'openai',
    },
    secondaryAI: {
      type: String,
      enum: ['openai', 'gemini', 'none'],
      default: 'gemini',
    },
  },
  { timestamps: true },
);

export default mongoose.model('Setting', SettingSchema);
