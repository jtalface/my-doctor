/**
 * useCycleEligibility Hook
 * 
 * Checks if the current active profile is eligible for cycle tracking:
 * - Must be female (sexAtBirth)
 * - If dependent, must be age 10+
 */

import { useMemo } from 'react';
import { useActiveProfile } from '../contexts';

export function useCycleEligibility(): {
  isEligible: boolean;
  isLoading: boolean;
} {
  const { 
    activeProfile, 
    activePatientProfile, 
    isViewingDependent, 
    isLoadingProfile 
  } = useActiveProfile();
  
  const isEligible = useMemo(() => {
    // Wait for profile to load
    if (isLoadingProfile || !activeProfile || !activePatientProfile) {
      return false;
    }
    
    // Check if female
    const sexAtBirth = activePatientProfile.demographics?.sexAtBirth;
    
    if (sexAtBirth !== 'female') {
      return false;
    }
    
    // If dependent, check age (must be 10+)
    if (isViewingDependent) {
      const dateOfBirth = activePatientProfile.demographics?.dateOfBirth;
      if (dateOfBirth) {
        const age = Math.floor(
          (Date.now() - new Date(dateOfBirth).getTime()) / 
          (365.25 * 24 * 60 * 60 * 1000)
        );
        
        if (age < 10) {
          return false;
        }
      }
    }
    
    return true;
  }, [activeProfile, activePatientProfile, isViewingDependent, isLoadingProfile]);
  
  return { 
    isEligible, 
    isLoading: isLoadingProfile 
  };
}

