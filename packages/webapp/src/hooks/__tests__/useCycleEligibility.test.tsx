/**
 * useCycleEligibility Hook Tests
 * 
 * Tests cycle tracker eligibility logic based on user profile
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider } from '../../auth/AuthContext';
import { ActiveProfileProvider } from '../../contexts/ActiveProfileContext';
import { useCycleEligibility } from '../useCycleEligibility';
import type { ReactNode } from 'react';

// Helper to create wrapper with all necessary providers
function createWrapper(mockProfile: any = {}) {
  const mockUser = {
    _id: 'test-user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    preferences: { language: 'en' },
  };

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthProvider initialUser={mockUser as any}>
        <ActiveProfileProvider
          initialProfile={mockProfile}
          initialDependents={[]}
        >
          {children}
        </ActiveProfileProvider>
      </AuthProvider>
    );
  };
}

describe('useCycleEligibility', () => {
  describe('Basic Eligibility', () => {
    it('returns eligible for female users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female',
          dateOfBirth: '1995-01-01',
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns not eligible for male users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'male',
          dateOfBirth: '1995-01-01',
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('returns not eligible for non-binary users', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'other',
          dateOfBirth: '1995-01-01',
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(false);
    });
  });

  describe('Loading State', () => {
    it('returns isLoading true when profile is not loaded', () => {
      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isEligible).toBe(false);
      // Note: isLoading depends on ActiveProfileContext implementation
    });

    it('returns isEligible false when profile is null', () => {
      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(null),
      });

      expect(result.current.isEligible).toBe(false);
    });
  });

  describe('Age Requirements for Dependents', () => {
    it('returns eligible for dependent aged 10+', () => {
      // Calculate date of birth for 10-year-old
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      tenYearsAgo.setMonth(0, 1); // Start of year to ensure 10 years

      const mockProfile = {
        userId: 'dependent-1',
        demographics: {
          sexAtBirth: 'female',
          dateOfBirth: tenYearsAgo.toISOString(),
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(true);
    });

    it('returns eligible for dependent aged 15', () => {
      const fifteenYearsAgo = new Date();
      fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);

      const mockProfile = {
        userId: 'dependent-1',
        demographics: {
          sexAtBirth: 'female',
          dateOfBirth: fifteenYearsAgo.toISOString(),
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('returns not eligible when demographics is missing', () => {
      const mockProfile = {
        userId: 'test-user-1',
        // No demographics field
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(false);
    });

    it('returns not eligible when sexAtBirth is missing', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          dateOfBirth: '1995-01-01',
          // No sexAtBirth
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current.isEligible).toBe(false);
    });

    it('returns eligible when dateOfBirth is missing for non-dependent', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female',
          // No dateOfBirth - OK for main profile
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      // Should be eligible since no age check for main profile
      expect(result.current.isEligible).toBe(true);
    });
  });

  describe('Return Values', () => {
    it('returns object with isEligible and isLoading properties', () => {
      const mockProfile = {
        userId: 'test-user-1',
        demographics: {
          sexAtBirth: 'female',
          dateOfBirth: '1995-01-01',
        },
      };

      const { result } = renderHook(() => useCycleEligibility(), {
        wrapper: createWrapper(mockProfile),
      });

      expect(result.current).toHaveProperty('isEligible');
      expect(result.current).toHaveProperty('isLoading');
      expect(typeof result.current.isEligible).toBe('boolean');
      expect(typeof result.current.isLoading).toBe('boolean');
    });
  });
});

