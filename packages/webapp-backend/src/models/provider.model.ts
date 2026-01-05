/**
 * Provider Model
 * 
 * Represents healthcare providers (doctors, nurses, etc.) who can
 * communicate with patients through the messaging system.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  email: string;
  specialty: string;           // e.g., "General Medicine", "Pediatrics"
  title?: string;              // e.g., "Dr.", "Nurse"
  avatarUrl?: string;
  phone?: string;
  licenseNumber?: string;
  bio?: string;                // Short description
  languages: string[];         // Languages spoken
  isActive: boolean;           // Can receive new conversations
  isAvailable: boolean;        // Currently available for chat
  lastActiveAt?: Date;         // For online status calculation
  workingHours?: {
    start: string;             // e.g., "09:00"
    end: string;               // e.g., "17:00"
    timezone: string;          // e.g., "Africa/Maputo"
    daysOfWeek: number[];      // 0=Sunday, 1=Monday, etc.
  };
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    specialty: { 
      type: String, 
      required: true,
      default: 'General Medicine'
    },
    title: { type: String, trim: true },
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    languages: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true },
    lastActiveAt: { type: Date },
    workingHours: {
      start: { type: String },
      end: { type: String },
      timezone: { type: String, default: 'Africa/Maputo' },
      daysOfWeek: [{ type: Number }],
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ProviderSchema.index({ specialty: 1, isActive: 1 });
ProviderSchema.index({ lastActiveAt: -1 });

// Virtual to check if provider is "online" (active in last 5 minutes)
ProviderSchema.virtual('isOnline').get(function() {
  if (!this.lastActiveAt) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastActiveAt > fiveMinutesAgo;
});

// Method to update last active timestamp
ProviderSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

// Ensure virtuals are included in JSON
ProviderSchema.set('toJSON', { virtuals: true });
ProviderSchema.set('toObject', { virtuals: true });

export const Provider = mongoose.model<IProvider>('Provider', ProviderSchema);

