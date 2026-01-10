/**
 * Vitest Setup File
 * 
 * This file runs before all tests and sets up the testing environment.
 * It's configured in vitest.config.ts under `setupFiles`.
 */

import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Extend Vitest matchers with jest-dom
// This gives us useful assertions like:
// - expect(element).toBeInTheDocument()
// - expect(element).toHaveTextContent('...')
// - expect(element).toBeVisible()

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia (used by responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading, infinite scroll, etc.)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by charts, responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Suppress console errors in tests (optional - comment out to see all errors)
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes('Warning: ReactDOM.render')
//     ) {
//       return;
//     }
//     originalError.call(console, ...args);
//   };
// });
// 
// afterAll(() => {
//   console.error = originalError;
// });

