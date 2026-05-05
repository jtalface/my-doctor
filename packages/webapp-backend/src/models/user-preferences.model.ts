import mongoose, { Document, Schema } from 'mongoose';
import type { PreventiveLanguage } from '../preventive/types.js';

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  language: PreventiveLanguage;
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    language: { type: String, enum: ['pt', 'en', 'fr', 'sw'], default: 'pt', index: true },
  },
  { timestamps: true }
);

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema);
