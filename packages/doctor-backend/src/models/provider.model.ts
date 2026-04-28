/**
 * Provider Model (Shared)
 * 
 * This is the same Provider model as in webapp-backend.
 * Both backends share the same MongoDB collection.
 * 
 * The doctor-backend uses this for authentication.
 * The webapp-backend uses this for displaying provider info to patients.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProvider extends Document {
  // Basic info
  firstName: string;
  lastName: string;
  name: string;    // Virtual: firstName + lastName
  email: string;
  passwordHash?: string;
  
  // Professional info
  specialty: string;
  title?: string;
  licenseNumber?: string;
  
  // Profile
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  languages: string[];
  
  // Status
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  
  // Working hours
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
    daysOfWeek: number[];
  };
  
  // Preferences
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema = new Schema<IProvider>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String },
    
    specialty: { 
      type: String, 
      required: true,
      default: 'General Medicine'
    },
    title: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    languages: [{ type: String }],
    
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
    lastLoginAt: { type: Date },
    
    workingHours: {
      start: { type: String },
      end: { type: String },
      timezone: { type: String, default: 'Africa/Maputo' },
      daysOfWeek: [{ type: Number }],
    },
    
    preferences: {
      notifications: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      language: { type: String, default: 'pt' },
    },
  },
  { timestamps: true }
);

// Virtual for full name
ProviderSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Virtual for online status
ProviderSchema.virtual('isOnline').get(function() {
  if (!this.lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActiveAt > fiveMinutesAgo;
});

ProviderSchema.set('toJSON', { virtuals: true });
ProviderSchema.set('toObject', { virtuals: true });

export const Provider = mongoose.model<IProvider>('Provider', ProviderSchema);

