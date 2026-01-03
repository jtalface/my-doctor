/**
 * ActiveProfileContext
 * 
 * Manages the currently active profile (self or dependent) for health checkups
 * and other user-specific operations.
 */

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { useAuth, PatientProfile } from '../auth';
import { api, Dependent } from '../services/api';

// The active profile can be either the account holder (self) or a dependent
export interface ActiveProfile {
  id: string;
  name: string;
  isDependent: boolean;
  relationship?: Dependent['relationship'];
  dateOfBirth?: string;
  age?: number;
  preferences?: {
    language: string;
  };
}

interface ActiveProfileContextType {
  // Current active profile
  activeProfile: ActiveProfile | null;
  
  // Active profile's patient data
  activePatientProfile: PatientProfile | null;
  
  // All available profiles (self + dependents)
  dependents: Dependent[];
  
  // Loading states
  isLoadingDependents: boolean;
  isLoadingProfile: boolean;
  
  // Actions
  switchToSelf: () => void;
  switchToDependent: (dependentId: string) => Promise<void>;
  
  // Dependent management
  refreshDependents: () => Promise<void>;
  addDependent: (input: {
    name: string;
    dateOfBirth: string;
    relationship: Dependent['relationship'];
    language?: string;
  }) => Promise<Dependent>;
  updateDependent: (dependentId: string, updates: {
    name?: string;
    dateOfBirth?: string;
    language?: string;
  }) => Promise<Dependent>;
  deleteDependent: (dependentId: string) => Promise<void>;
  
  // Profile management for active profile
  updateActiveProfile: (updates: Partial<PatientProfile>) => Promise<void>;
  
  // Check if viewing a dependent
  isViewingDependent: boolean;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | null>(null);

// Storage key for persisting active profile selection
const ACTIVE_PROFILE_KEY = 'zambe_active_profile';

export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAuthenticated, updateProfile } = useAuth();
  
  const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
  const [activePatientProfile, setActivePatientProfile] = useState<PatientProfile | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [isLoadingDependents, setIsLoadingDependents] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Initialize active profile when user logs in
  useEffect(() => {
    if (user && isAuthenticated) {
      // Check if there's a saved active profile
      const savedProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
      
      if (savedProfileId && savedProfileId !== user.id) {
        // Try to restore to a dependent
        // Will be validated when dependents are loaded
      } else {
        // Default to self
        setActiveProfile({
          id: user.id,
          name: user.name,
          isDependent: false,
          preferences: { language: user.preferences.language },
        });
        setActivePatientProfile(profile);
      }
    } else {
      // Clear on logout
      setActiveProfile(null);
      setActivePatientProfile(null);
      setDependents([]);
      localStorage.removeItem(ACTIVE_PROFILE_KEY);
    }
  }, [user, isAuthenticated, profile]);

  // Load dependents when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshDependents();
    }
  }, [isAuthenticated]);

  // Validate saved active profile against loaded dependents
  useEffect(() => {
    const savedProfileId = localStorage.getItem(ACTIVE_PROFILE_KEY);
    
    if (savedProfileId && user && savedProfileId !== user.id) {
      // Check if the saved dependent still exists
      const savedDependent = dependents.find(d => d.id === savedProfileId);
      if (savedDependent) {
        // Restore to this dependent
        switchToDependent(savedProfileId);
      } else {
        // Dependent no longer exists, switch to self
        switchToSelf();
      }
    }
  }, [dependents, user]);

  // Switch to account holder's own profile
  const switchToSelf = useCallback(() => {
    if (!user) return;
    
    setActiveProfile({
      id: user.id,
      name: user.name,
      isDependent: false,
      preferences: { language: user.preferences.language },
    });
    setActivePatientProfile(profile);
    localStorage.setItem(ACTIVE_PROFILE_KEY, user.id);
  }, [user, profile]);

  // Switch to a dependent's profile
  const switchToDependent = useCallback(async (dependentId: string) => {
    const dependent = dependents.find(d => d.id === dependentId);
    if (!dependent) {
      console.error('[ActiveProfile] Dependent not found:', dependentId);
      return;
    }

    setActiveProfile({
      id: dependent.id,
      name: dependent.name,
      isDependent: true,
      relationship: dependent.relationship,
      dateOfBirth: dependent.dateOfBirth,
      age: dependent.age,
      preferences: { language: dependent.preferences.language },
    });

    // Load dependent's patient profile
    setIsLoadingProfile(true);
    try {
      const dependentProfile = await api.getDependentProfile(dependentId);
      setActivePatientProfile(dependentProfile);
    } catch (error) {
      console.error('[ActiveProfile] Failed to load dependent profile:', error);
      // Create empty profile structure
      setActivePatientProfile({
        userId: dependentId,
        demographics: {},
        medicalHistory: {
          chronicConditions: [],
          allergies: [],
          medications: [],
          surgeries: [],
          familyHistory: [],
        },
        lifestyle: {},
      });
    } finally {
      setIsLoadingProfile(false);
    }

    localStorage.setItem(ACTIVE_PROFILE_KEY, dependentId);
  }, [dependents]);

  // Refresh dependents list from API
  const refreshDependents = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingDependents(true);
    try {
      const deps = await api.getDependents();
      setDependents(deps);
    } catch (error) {
      console.error('[ActiveProfile] Failed to load dependents:', error);
    } finally {
      setIsLoadingDependents(false);
    }
  }, [isAuthenticated]);

  // Add a new dependent
  const addDependent = useCallback(async (input: {
    name: string;
    dateOfBirth: string;
    relationship: Dependent['relationship'];
    language?: string;
  }): Promise<Dependent> => {
    const newDependent = await api.createDependent(input);
    setDependents(prev => [...prev, newDependent]);
    return newDependent;
  }, []);

  // Update a dependent
  const updateDependentHandler = useCallback(async (
    dependentId: string, 
    updates: { name?: string; dateOfBirth?: string; language?: string }
  ): Promise<Dependent> => {
    const updated = await api.updateDependent(dependentId, updates);
    setDependents(prev => prev.map(d => d.id === dependentId ? updated : d));
    
    // Update active profile if this is the active dependent
    if (activeProfile?.id === dependentId) {
      setActiveProfile(prev => prev ? {
        ...prev,
        name: updated.name,
        dateOfBirth: updated.dateOfBirth,
        age: updated.age,
        preferences: { language: updated.preferences.language },
      } : null);
    }
    
    return updated;
  }, [activeProfile]);

  // Delete a dependent
  const deleteDependent = useCallback(async (dependentId: string) => {
    await api.deleteDependent(dependentId);
    setDependents(prev => prev.filter(d => d.id !== dependentId));
    
    // If deleting the active dependent, switch to self
    if (activeProfile?.id === dependentId) {
      switchToSelf();
    }
  }, [activeProfile, switchToSelf]);

  // Update the active profile's patient data
  const updateActiveProfile = useCallback(async (updates: Partial<PatientProfile>) => {
    if (!activeProfile) return;

    if (activeProfile.isDependent) {
      // Update dependent profile
      const updated = await api.updateDependentProfile(activeProfile.id, updates);
      setActivePatientProfile(updated);
    } else {
      // Update own profile via auth context
      await updateProfile(updates);
      // The auth context will update the profile state
    }
  }, [activeProfile, updateProfile]);

  const isViewingDependent = activeProfile?.isDependent ?? false;

  return (
    <ActiveProfileContext.Provider value={{
      activeProfile,
      activePatientProfile,
      dependents,
      isLoadingDependents,
      isLoadingProfile,
      switchToSelf,
      switchToDependent,
      refreshDependents,
      addDependent,
      updateDependent: updateDependentHandler,
      deleteDependent,
      updateActiveProfile,
      isViewingDependent,
    }}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) {
    throw new Error('useActiveProfile must be used within an ActiveProfileProvider');
  }
  return context;
}

