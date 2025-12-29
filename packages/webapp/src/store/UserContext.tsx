import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User, PatientProfile } from '../services/api';

interface UserContextType {
  user: User | null;
  profile: PatientProfile | null;
  isLoading: boolean;
  isNewUser: boolean;
  login: (email: string, name: string, language?: string) => Promise<{ isNew: boolean }>;
  logout: () => void;
  updateProfile: (updates: Partial<PatientProfile>) => Promise<void>;
  updateLanguage: (language: string) => Promise<void>;
  setIsNewUser: (value: boolean) => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

const USER_ID_KEY = 'mydoctor_user_id';

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const loadUser = async () => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId) {
      try {
        const userData = await api.getUser(userId);
        setUser(userData);
        const profileData = await api.getUserProfile(userId);
        setProfile(profileData);
      } catch (err) {
        console.error('Failed to load user:', err);
        localStorage.removeItem(USER_ID_KEY);
      }
    }
    setIsLoading(false);
  };

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, name: string, language?: string) => {
    const userData = await api.createUser({ 
      email, 
      name, 
      isGuest: false,
      preferences: language ? { language } : undefined,
    });
    localStorage.setItem(USER_ID_KEY, userData.id);
    setUser(userData);
    
    // Check if profile has data (existing user) or is empty (new user)
    const profileData = await api.getUserProfile(userData.id);
    setProfile(profileData);
    
    // A user is "new" if they don't have a date of birth set yet
    const isNew = !profileData.demographics?.dateOfBirth;
    setIsNewUser(isNew);
    
    return { isNew };
  };

  const logout = () => {
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    setProfile(null);
    setIsNewUser(false);
  };

  const updateProfile = async (updates: Partial<PatientProfile>) => {
    if (!user) return;
    const updatedProfile = await api.updateUserProfile(user.id, updates);
    setProfile(updatedProfile);
  };

  const updateLanguage = async (language: string) => {
    if (!user) return;
    const updatedUser = await api.updateUser(user.id, {
      preferences: {
        ...user.preferences,
        language,
      },
    });
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      profile, 
      isLoading, 
      isNewUser, 
      login, 
      logout, 
      updateProfile,
      updateLanguage,
      setIsNewUser,
      refreshUser,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

