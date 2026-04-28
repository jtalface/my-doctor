/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Doctor, LoginCredentials, RegisterData, AuthState } from './types';
import * as api from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  refreshDoctor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshDoctor = useCallback(async () => {
    try {
      const { doctor: doctorData } = await api.getMe();
      setDoctor(doctorData);
    } catch {
      /* not signed in or session expired */
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const refreshed = await api.refreshToken();
      if (refreshed) {
        const { doctor: doctorData } = await api.getMe();
        setDoctor(doctorData);
        return true;
      }
      setDoctor(null);
      return false;
    } catch {
      setDoctor(null);
      return false;
    }
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAuth();
      setIsLoading(false);
    };
    init();
  }, [refreshAuth]);

  const login = async (credentials: LoginCredentials) => {
    const response = await api.login(credentials);
    setDoctor(response.doctor);
  };

  const register = async (data: RegisterData) => {
    const response = await api.register(data);
    setDoctor(response.doctor);
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setDoctor(null);
    }
  };

  const value: AuthContextType = {
    doctor,
    isAuthenticated: !!doctor,
    isLoading,
    login,
    register,
    logout,
    refreshAuth,
    refreshDoctor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

