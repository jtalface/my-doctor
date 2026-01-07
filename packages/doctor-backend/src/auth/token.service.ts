/**
 * Token Service
 * 
 * Handles JWT access tokens and refresh tokens for doctor authentication.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DoctorRefreshToken } from '../models/doctor-refresh-token.model.js';
import config from '../config/index.js';

interface AccessTokenPayload {
  providerId: string;
  email: string;
  type: 'doctor';
}

class TokenService {
  private jwtSecret: string;
  private accessTokenExpiry: string;
  private refreshTokenExpiry: string;

  constructor() {
    this.jwtSecret = config.jwtSecret;
    this.accessTokenExpiry = config.jwtAccessExpiry;
    this.refreshTokenExpiry = config.jwtRefreshExpiry;
  }

  /**
   * Generate an access token for a doctor
   */
  generateAccessToken(providerId: string, email: string): string {
    const payload: AccessTokenPayload = {
      providerId,
      email,
      type: 'doctor',
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry as string,
    } as jwt.SignOptions);
  }

  /**
   * Verify an access token
   */
  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AccessTokenPayload;
      if (decoded.type !== 'doctor') {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Generate a refresh token
   */
  async generateRefreshToken(
    providerId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);
    
    const expiresAt = this.calculateExpiry(this.refreshTokenExpiry);

    await DoctorRefreshToken.create({
      providerId,
      tokenHash,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { token, expiresAt };
  }

  /**
   * Validate a refresh token and return the associated doctor ID
   */
  async validateRefreshToken(token: string): Promise<string | null> {
    const tokenHash = this.hashToken(token);

    const refreshToken = await DoctorRefreshToken.findOne({
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!refreshToken) {
      return null;
    }

    return refreshToken.providerId.toString();
  }

  /**
   * Revoke a refresh token
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const result = await DoctorRefreshToken.updateOne(
      { tokenHash },
      { $set: { isRevoked: true } }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Revoke all refresh tokens for a doctor
   */
  async revokeAllDoctorTokens(providerId: string): Promise<void> {
    await DoctorRefreshToken.updateMany(
      { providerId, isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }

  /**
   * Get access token expiry in seconds
   */
  getAccessTokenExpiry(): number {
    return this.parseExpiry(this.accessTokenExpiry);
  }

  /**
   * Hash a token for storage
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Parse expiry string to milliseconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match || !match[1] || !match[2]) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }

  /**
   * Calculate expiry date from string
   */
  private calculateExpiry(expiry: string): Date {
    const seconds = this.parseExpiry(expiry);
    return new Date(Date.now() + seconds * 1000);
  }
}

export const tokenService = new TokenService();

