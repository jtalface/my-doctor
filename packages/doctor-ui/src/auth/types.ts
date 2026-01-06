/**
 * Authentication Types
 */

export interface Doctor {
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

export interface AuthState {
  doctor: Doctor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  specialty: string;
  title?: string;
  licenseNumber?: string;
  phone?: string;
}

export interface AuthResponse {
  doctor: Doctor;
  accessToken: string;
  expiresIn: number;
}

