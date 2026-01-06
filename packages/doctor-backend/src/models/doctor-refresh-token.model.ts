/**
 * Doctor Refresh Token Model
 * 
 * Stores refresh tokens for doctor authentication.
 * Separate from patient refresh tokens for security isolation.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctorRefreshToken extends Document {
  providerId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
  isRevoked: boolean;
  createdAt: Date;
}

const DoctorRefreshTokenSchema = new Schema<IDoctorRefreshToken>(
  {
    providerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Provider', 
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true }, // Removed index: true - handled by TTL index below
    userAgent: { type: String },
    ipAddress: { type: String },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index for automatic cleanup of expired tokens
DoctorRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding active tokens
DoctorRefreshTokenSchema.index({ providerId: 1, isRevoked: 1 });

export const DoctorRefreshToken = mongoose.model<IDoctorRefreshToken>(
  'DoctorRefreshToken', 
  DoctorRefreshTokenSchema
);

