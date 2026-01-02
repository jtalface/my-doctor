import mongoose, { Document, Schema } from 'mongoose';

/**
 * Refresh Token Model
 * 
 * Stores refresh tokens for token rotation and revocation.
 * Each refresh token is stored with a unique ID that's included in the JWT.
 * When a token is used, it's marked as used and a new one is issued.
 * This allows for:
 * - Token revocation (logout)
 * - Detecting token reuse (security feature)
 * - Cleaning up expired tokens
 */

export interface IRefreshToken extends Document {
  tokenId: string;       // Unique identifier for this token (included in JWT)
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  isUsed: boolean;       // Token rotation: mark as used after refresh
  isRevoked: boolean;    // Explicitly revoked (logout)
  userAgent?: string;    // Browser/device info for device management
  ipAddress?: string;    // IP for security logging
  createdAt: Date;
  updatedAt: Date;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenId: { 
      type: String, 
      required: true, 
      unique: true,
      index: true,
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true,
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: true,
    },
    isUsed: { type: Boolean, default: false },
    isRevoked: { type: Boolean, default: false },
    userAgent: { type: String },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

// Compound index for efficient queries
RefreshTokenSchema.index({ userId: 1, isRevoked: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-cleanup

// Check if token is valid (not used, not revoked, not expired)
RefreshTokenSchema.virtual('isValid').get(function() {
  return !this.isUsed && !this.isRevoked && this.expiresAt > new Date();
});

// Static method to revoke all tokens for a user (logout from all devices)
RefreshTokenSchema.statics.revokeAllForUser = function(userId: string) {
  return this.updateMany(
    { userId, isRevoked: false },
    { $set: { isRevoked: true } }
  );
};

// Static method to clean up old tokens (can be run as a cron job)
RefreshTokenSchema.statics.cleanupExpired = function() {
  return this.deleteMany({ expiresAt: { $lt: new Date() } });
};

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);

