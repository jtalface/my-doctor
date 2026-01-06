/**
 * User Model (Read-Only from webapp-backend)
 * 
 * Doctor-backend reads patient data but doesn't modify it.
 * This is a minimal schema for reading patient info.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  name?: string;
  isGuest: boolean;
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    language: string;
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, lowercase: true, trim: true },
    name: { type: String, trim: true },
    isGuest: { type: Boolean, default: false },
    preferences: {
      notifications: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

