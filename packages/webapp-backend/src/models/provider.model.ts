/**
 * Provider Model
 * 
 * Represents healthcare providers (doctors, nurses, etc.) who can
 * communicate with patients through the messaging system.
 * 
 * This model is shared between webapp-backend (patient-facing) and
 * doctor-backend (doctor-facing). The password field is used by
 * doctor-backend for authentication.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProvider extends Document {
  // Basic info
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;       // For doctor authentication (optional for legacy/seeded data)
  
  // Professional info
  specialty: string;           // e.g., "General Medicine", "Pediatrics"
  title?: string;              // e.g., "Dr.", "Nurse"
  licenseNumber?: string;
  
  // Profile
  avatarUrl?: string;
  phone?: string;
  bio?: string;                // Short description
  languages: string[];         // Languages spoken
  
  // Status
  isActive: boolean;           // Can receive new conversations
  isAvailable: boolean;        // Currently available for chat
  isVerified: boolean;         // Has verified their credentials
  lastActiveAt?: Date;         // For online status calculation
  lastLoginAt?: Date;          // Last login timestamp
  
  // Working hours
  workingHours?: {
    start: string;             // e.g., "09:00"
    end: string;               // e.g., "17:00"
    timezone: string;          // e.g., "Africa/Maputo"
    daysOfWeek: number[];      // 0=Sunday, 1=Monday, etc.
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
    // Basic info
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    passwordHash: { type: String }, // Optional - for doctor authentication
    
    // Professional info
    specialty: { 
      type: String, 
      required: true,
      default: 'General Medicine'
    },
    title: { type: String, trim: true },
    licenseNumber: { type: String, trim: true },
    
    // Profile
    avatarUrl: { type: String },
    phone: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    languages: [{ type: String }],
    
    // Status
    isActive: { type: Boolean, default: true, index: true },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastActiveAt: { type: Date },
    lastLoginAt: { type: Date },
    
    // Working hours
    workingHours: {
      start: { type: String },
      end: { type: String },
      timezone: { type: String, default: 'Africa/Maputo' },
      daysOfWeek: [{ type: Number }],
    },
    
    // Preferences
    preferences: {
      notifications: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: true },
      language: { type: String, default: 'en' },
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
ProviderSchema.index({ specialty: 1, isActive: 1 });
ProviderSchema.index({ lastActiveAt: -1 });

// Virtual for full name
ProviderSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

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

