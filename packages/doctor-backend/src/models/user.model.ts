/**
 * User Model (Read-Only from webapp-backend)
 * 
 * Doctor-backend reads patient data but doesn't modify it.
 * This is a minimal schema for reading patient info.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email?: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual
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
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
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

// Virtual for full name
UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Include virtuals in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

export const User = mongoose.model<IUser>('User', UserSchema);

