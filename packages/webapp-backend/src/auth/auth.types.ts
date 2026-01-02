/**
 * Authentication Types
 * 
 * TypeScript interfaces and types for the authentication system.
 */

import { Request } from 'express';
import { IUser } from '../models/user.model.js';

/**
 * JWT Payload for Access Tokens
 */
export interface AccessTokenPayload {
  userId: string;
  email: string;
  type: 'access';
  iat?: number;
  exp?: number;
}

/**
 * JWT Payload for Refresh Tokens
 */
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string; // Unique ID for this refresh token (for revocation)
  type: 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * Login Request Body
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration Request Body
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  language?: string;
}

/**
 * Auth Response (returned after login/register)
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    isGuest: boolean;
    preferences: IUser['preferences'];
  };
  accessToken: string;
  expiresIn: number; // Access token expiry in seconds
}

/**
 * Token Refresh Response
 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

/**
 * Password Validation Result
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

/**
 * Password Reset Request
 */
export interface ForgotPasswordRequest {
  email: string;
}

/**
 * Password Reset Confirmation
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/**
 * Error codes for auth operations
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  RATE_LIMITED = 'RATE_LIMITED',
}

/**
 * Auth Error class for standardized error handling
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

