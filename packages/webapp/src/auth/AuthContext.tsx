/**
 * Auth Context
 * 
 * Provides authentication state and methods throughout the app.
 * Replaces the old UserContext with proper JWT-based authentication.
 */

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as authService from './authService';
import { authFetch } from './authService';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
  preferences: {
    notifications: boolean;
    dataSharing: boolean;
    language: string;
  };
}

export interface PatientProfile {
  userId: string;
  demographics: {
    dateOfBirth?: string;
    age?: number;
    sexAtBirth?: 'male' | 'female' | 'other';
    heightCm?: number;
    weightKg?: number;
  };
  medicalHistory: {
    chronicConditions: string[];
    allergies: string[];
    medications: string[];
    surgeries: string[];
    familyHistory: string[];
  };
  lifestyle: {
    smoking?: 'never' | 'former' | 'current';
    alcohol?: 'never' | 'occasional' | 'regular' | 'heavy';
    exercise?: 'sedentary' | 'light' | 'moderate' | 'active';
    diet?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: PatientProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isNewUser: boolean;
  
  // Auth methods
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile methods
  updateProfile: (updates: Partial<PatientProfile>) => Promise<void>;
  updateUserPreferences: (updates: Partial<User['preferences']>) => Promise<void>;
  
  // State management
  setIsNewUser: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Load user profile
  const loadProfile = useCallback(async (userId: string): Promise<PatientProfile | null> => {
    try {
      const profileData = await authFetch<PatientProfile>(`/api/user/${userId}/profile`);
      return profileData;
    } catch (error) {
      console.error('[Auth] Failed to load profile:', error);
      return null;
    }
  }, []);

  // Try to restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const restoredUser = await authService.tryRestoreSession();
        if (restoredUser) {
          setUser(restoredUser);
          const profileData = await loadProfile(restoredUser.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('[Auth] Session restore failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [loadProfile]);

  // Login
  const login = async (email: string, password: string, rememberMe = false) => {
    const result = await authService.login({ email, password, rememberMe });
    setUser(result.user);
    
    // Load profile
    const profileData = await loadProfile(result.user.id);
    setProfile(profileData);
    
    // Check if new user (no profile data yet)
    const isNew = !profileData?.demographics?.dateOfBirth;
    setIsNewUser(isNew);
  };

  // Register
  const register = async (email: string, password: string, name: string, language?: string) => {
    const result = await authService.register({ email, password, name, language });
    setUser(result.user);
    
    // New users always need to set up their profile
    setProfile(null);
    setIsNewUser(true);
  };

  // Logout
  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setIsNewUser(false);
  };

  // Update profile
  const updateProfile = async (updates: Partial<PatientProfile>) => {
    if (!user) return;
    
    const updatedProfile = await authFetch<PatientProfile>(`/api/user/${user.id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setProfile(updatedProfile);
  };

  // Update user preferences
  const updateUserPreferences = async (updates: Partial<User['preferences']>) => {
    if (!user) return;
    
    const updatedUser = await authFetch<User>(`/api/user/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ preferences: { ...user.preferences, ...updates } }),
    });
    setUser({ ...user, preferences: updatedUser.preferences });
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const refreshedUser = await authService.getCurrentUser();
      setUser(refreshedUser);
      
      const profileData = await loadProfile(refreshedUser.id);
      setProfile(profileData);
    } catch (error) {
      console.error('[Auth] Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isAuthenticated: !!user,
      isNewUser,
      login,
      register,
      logout,
      updateProfile,
      updateUserPreferences,
      setIsNewUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Backward compatibility alias
export const useUser = useAuth;

