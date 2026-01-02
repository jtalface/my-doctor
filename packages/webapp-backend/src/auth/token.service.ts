/**
 * Token Service
 * 
 * Handles JWT token generation and verification.
 * Implements access and refresh token patterns with token rotation.
 */

import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authConfig } from './auth.config.js';
import { 
  AccessTokenPayload, 
  RefreshTokenPayload, 
  AuthError, 
  AuthErrorCode 
} from './auth.types.js';
import { RefreshToken } from '../models/refresh-token.model.js';

class TokenService {
  private readonly accessSecret = authConfig.jwt.accessSecret;
  private readonly refreshSecret = authConfig.jwt.refreshSecret;
  private readonly accessExpiresIn = authConfig.jwt.accessExpiresIn;
  private readonly refreshExpiresIn = authConfig.jwt.refreshExpiresIn;

  /**
   * Generate an access token
   */
  generateAccessToken(userId: string, email: string): string {
    const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
      userId,
      email,
      type: 'access',
    };

    const options: SignOptions = {
      expiresIn: this.accessExpiresIn,
      algorithm: 'HS256',
    };

    return jwt.sign(payload, this.accessSecret, options);
  }

  /**
   * Generate a refresh token and store it in the database
   */
  async generateRefreshToken(
    userId: string, 
    userAgent?: string, 
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const tokenId = uuidv4();
    
    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
      userId,
      tokenId,
      type: 'refresh',
    };

    const options: SignOptions = {
      expiresIn: this.refreshExpiresIn,
      algorithm: 'HS256',
    };

    const token = jwt.sign(payload, this.refreshSecret, options);

    // Store token in database for revocation support
    await RefreshToken.create({
      tokenId,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return { token, expiresAt };
  }

  /**
   * Verify an access token
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, this.accessSecret) as JwtPayload & AccessTokenPayload;
      
      if (payload.type !== 'access') {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Invalid token type',
          401
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError(
          AuthErrorCode.TOKEN_EXPIRED,
          'Access token has expired',
          401
        );
      }
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid access token',
        401
      );
    }
  }

  /**
   * Verify a refresh token and check if it's valid in the database
   */
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, this.refreshSecret) as JwtPayload & RefreshTokenPayload;
      
      if (payload.type !== 'refresh') {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Invalid token type',
          401
        );
      }

      // Check if token exists and is valid in database
      const storedToken = await RefreshToken.findOne({ tokenId: payload.tokenId });
      
      if (!storedToken) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Refresh token not found',
          401
        );
      }

      if (storedToken.isRevoked) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Refresh token has been revoked',
          401
        );
      }

      if (storedToken.isUsed) {
        // Token reuse detected - possible token theft!
        // Revoke all tokens for this user as a security measure
        await RefreshToken.updateMany(
          { userId: payload.userId },
          { $set: { isRevoked: true } }
        );
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Refresh token has already been used. All sessions have been terminated for security.',
          401
        );
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError(
          AuthErrorCode.TOKEN_EXPIRED,
          'Refresh token has expired',
          401
        );
      }
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid refresh token',
        401
      );
    }
  }

  /**
   * Rotate refresh token (mark old as used, generate new one)
   */
  async rotateRefreshToken(
    oldTokenId: string,
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    // Mark old token as used
    await RefreshToken.updateOne(
      { tokenId: oldTokenId },
      { $set: { isUsed: true } }
    );

    // Generate new token
    return this.generateRefreshToken(userId, userAgent, ipAddress);
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeRefreshToken(tokenId: string): Promise<void> {
    await RefreshToken.updateOne(
      { tokenId },
      { $set: { isRevoked: true } }
    );
  }

  /**
   * Revoke all refresh tokens for a user (logout from all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true } }
    );
  }

  /**
   * Get access token expiry in seconds (for client)
   */
  getAccessTokenExpiry(): number {
    // Parse expiry string (e.g., '15m') to seconds
    const match = this.accessExpiresIn.match(/^(\d+)(m|h|d)$/);
    if (!match || !match[1] || !match[2]) return 900; // Default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900;
    }
  }
}

export const tokenService = new TokenService();

