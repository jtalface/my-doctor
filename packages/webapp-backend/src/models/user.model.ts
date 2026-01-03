import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email?: string;  // Optional for dependents (they don't login)
  name: string;
  phone?: string;
  passwordHash?: string;
  isGuest: boolean;
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    language: string;
  };
  // Auth-related fields
  emailVerified: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  
  // Dependent-related fields
  isDependent: boolean;  // true = managed account (no login)
  dateOfBirth?: Date;    // Required for dependents (must be under 18)
  
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { 
      type: String, 
      lowercase: true,
      trim: true,
      // Note: unique sparse index defined below to properly handle null values for dependents
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String },
    isGuest: { type: Boolean, default: false },
    preferences: {
      notifications: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
      language: { type: String, default: 'en' },
    },
    // Auth-related fields
    emailVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    
    // Dependent-related fields
    isDependent: { type: Boolean, default: false },
    dateOfBirth: { type: Date },
  },
  { timestamps: true }
);

// Indexes
// Sparse unique index on email - allows multiple null values (for dependents)
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ isGuest: 1 });
UserSchema.index({ isDependent: 1 });

// Virtual to check if account is locked
UserSchema.virtual('isLocked').get(function() {
  return this.lockoutUntil && this.lockoutUntil > new Date();
});

// Method to increment failed login attempts
UserSchema.methods.incrementLoginAttempts = async function() {
  // Reset if lockout has expired
  if (this.lockoutUntil && this.lockoutUntil < new Date()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockoutUntil: 1 },
    });
  }

  const updates: any = { $inc: { failedLoginAttempts: 1 } };

  // Lock account if threshold reached (10 attempts)
  if (this.failedLoginAttempts + 1 >= 10) {
    updates.$set = { lockoutUntil: new Date(Date.now() + 30 * 60 * 1000) }; // 30 min
  }

  return this.updateOne(updates);
};

// Method to reset failed login attempts on successful login
UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { 
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    },
    $unset: { lockoutUntil: 1 },
  });
};

export const User = mongoose.model<IUser>('User', UserSchema);
