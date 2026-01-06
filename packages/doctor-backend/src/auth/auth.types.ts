/**
 * Authentication Types
 */

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  specialty: string;
  title?: string;
  licenseNumber?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface DoctorResponse {
  id: string;
  email: string;
  name: string;
  specialty: string;
  title?: string;
  avatarUrl?: string;
  isVerified: boolean;
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
  };
}

export interface AuthResponse {
  doctor: DoctorResponse;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  ACCOUNT_DISABLED = 'ACCOUNT_DISABLED',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NOT_FOUND = 'NOT_FOUND',
}

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

