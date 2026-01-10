/**
 * Custom Testing Utilities
 * 
 * This file provides custom render functions and utilities for testing
 * React components with all necessary providers (Router, Auth, etc.)
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext';
import { ActiveProfileProvider } from '../contexts/ActiveProfileContext';
import { CallProvider } from '../contexts/CallContext';
import type { User } from '../services/api';

// Define custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Mock user for AuthContext
   * Pass `null` to simulate unauthenticated state
   */
  mockUser?: Partial<User> | null;
  
  /**
   * Mock profile data for ActiveProfileContext
   */
  mockProfile?: any;
  
  /**
   * Mock dependents for ActiveProfileContext
   */
  mockDependents?: any[];
  
  /**
   * Initial route for BrowserRouter
   */
  initialRoute?: string;
  
  /**
   * Skip AuthProvider wrapper
   * Useful when testing auth components themselves
   */
  skipAuth?: boolean;
  
  /**
   * Skip ActiveProfileProvider wrapper
   */
  skipProfile?: boolean;
  
  /**
   * Skip CallProvider wrapper
   */
  skipCall?: boolean;
  
  /**
   * Skip BrowserRouter wrapper
   * Useful when testing with MemoryRouter or custom router
   */
  skipRouter?: boolean;
}

/**
 * Default mock user with common properties
 */
const defaultMockUser: User = {
  _id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
  isGuest: false,
  phoneNumber: '+1234567890',
  preferences: {
    language: 'en',
    notificationsEnabled: true,
    notifications: true,
    dataSharing: false,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Default mock patient profile
 */
const defaultMockProfile = {
  userId: 'test-user-id',
  age: 30,
  gender: 'female' as const,
  dateOfBirth: '1994-01-01',
  country: 'US',
  medicalHistory: [],
  currentMedications: [],
  allergies: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Custom render function that wraps components with all necessary providers
 * 
 * @example
 * ```tsx
 * import { render, screen } from '../__tests__/test-utils';
 * 
 * render(<MyComponent />, {
 *   mockUser: { email: 'custom@example.com' },
 *   mockProfile: { gender: 'male', age: 25 },
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    mockUser = defaultMockUser,
    mockProfile = defaultMockProfile,
    mockDependents = [],
    initialRoute = '/',
    skipAuth = false,
    skipProfile = false,
    skipCall = false,
    skipRouter = false,
    ...renderOptions
  }: CustomRenderOptions = {}
): ReturnType<typeof render> {
  // Navigate to initial route if needed
  if (!skipRouter && initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function AllTheProviders({ children }: { children: ReactNode }) {
    let tree = children;

    // Wrap with CallProvider (innermost)
    if (!skipCall) {
      tree = <CallProvider>{tree}</CallProvider>;
    }

    // Wrap with ActiveProfileProvider
    if (!skipProfile) {
      tree = (
        <ActiveProfileProvider
          initialProfile={mockProfile}
          initialDependents={mockDependents}
        >
          {tree}
        </ActiveProfileProvider>
      );
    }

    // Wrap with AuthProvider
    if (!skipAuth) {
      tree = (
        <AuthProvider initialUser={mockUser as User | null}>
          {tree}
        </AuthProvider>
      );
    }

    // Wrap with Router (outermost)
    if (!skipRouter) {
      tree = <BrowserRouter>{tree}</BrowserRouter>;
    }

    return <>{tree}</>;
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Export custom render as default render
export { renderWithProviders as render };

/**
 * Helper to create a mock authenticated user
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    ...defaultMockUser,
    ...overrides,
  };
}

/**
 * Helper to create a mock patient profile
 */
export function createMockProfile(overrides: any = {}) {
  return {
    ...defaultMockProfile,
    ...overrides,
  };
}

/**
 * Helper to create mock dependents
 */
export function createMockDependent(overrides: any = {}) {
  return {
    id: 'dependent-1',
    name: 'Child User',
    dateOfBirth: '2015-01-01',
    age: 9,
    relationship: 'child',
    isPrimary: false,
    preferences: {},
    ...overrides,
  };
}

/**
 * Mock API response helper
 */
export function mockApiResponse<T>(data: T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Mock API error helper
 */
export function mockApiError(message = 'API Error', status = 500): Promise<never> {
  return Promise.reject({
    message,
    status,
    response: {
      data: { message },
      status,
    },
  });
}

/**
 * Wait for loading states to complete
 * Useful for components that show loading spinners
 */
export async function waitForLoadingToFinish() {
  const { waitForElementToBeRemoved, screen } = await import('@testing-library/react');
  await waitForElementToBeRemoved(
    () => screen.queryByText(/loading/i) || screen.queryByRole('progressbar'),
    { timeout: 3000 }
  );
}

