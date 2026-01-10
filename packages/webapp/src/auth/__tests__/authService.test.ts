/**
 * authService Tests
 * 
 * Tests the authentication service including authFetch, token management,
 * and retry logic.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  authFetch,
  getAccessToken,
  setAccessToken,
  clearAccessToken,
  isAuthenticated,
  login,
  register,
  logout,
} from '../authService';

describe('authService', () => {
  beforeEach(() => {
    // Clear any existing tokens
    clearAccessToken();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore fetch
    vi.restoreAllMocks();
  });

  describe('Token Management', () => {
    it('sets and gets access token', async () => {
      const token = 'test-token-123';
      const expiresIn = 3600; // 1 hour

      setAccessToken(token, expiresIn);
      const retrieved = await getAccessToken();

      expect(retrieved).toBe(token);
    });

    it('returns null when no token is set', async () => {
      clearAccessToken();
      
      // Mock refresh to return null (no refresh token available)
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      const token = await getAccessToken();
      expect(token).toBeNull();
    });

    it('clears access token', async () => {
      setAccessToken('test-token', 3600);
      clearAccessToken();
      
      expect(isAuthenticated()).toBe(false);
    });

    it('detects authenticated state', () => {
      clearAccessToken();
      expect(isAuthenticated()).toBe(false);

      setAccessToken('test-token', 3600);
      expect(isAuthenticated()).toBe(true);
    });

    it('detects expired token', () => {
      // Set token that expires immediately
      setAccessToken('test-token', -1);
      
      // Should be expired
      expect(isAuthenticated()).toBe(false);
    });
  });

  describe('Token Refresh', () => {
    it('refreshes token when expired', async () => {
      // Set expired token
      setAccessToken('old-token', -1);

      // Mock refresh endpoint
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            accessToken: 'new-token-456',
            expiresIn: 3600,
          }),
        } as Response)
      );

      const token = await getAccessToken();
      expect(token).toBe('new-token-456');
    });

    it('refreshes token when about to expire (within 60s)', async () => {
      // Set token expiring in 30 seconds
      setAccessToken('old-token', 30);

      // Mock refresh endpoint
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            accessToken: 'refreshed-token',
            expiresIn: 3600,
          }),
        } as Response)
      );

      const token = await getAccessToken();
      expect(token).toBe('refreshed-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('handles refresh failure', async () => {
      setAccessToken('old-token', -1);

      // Mock failed refresh
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      const token = await getAccessToken();
      expect(token).toBeNull();
    });

    it('prevents multiple simultaneous refresh attempts', async () => {
      setAccessToken('old-token', -1);

      let refreshCount = 0;
      global.fetch = vi.fn(() => {
        refreshCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            accessToken: 'new-token',
            expiresIn: 3600,
          }),
        } as Response);
      });

      // Request token multiple times simultaneously
      const promises = [
        getAccessToken(),
        getAccessToken(),
        getAccessToken(),
      ];

      await Promise.all(promises);

      // Should only refresh once despite 3 requests
      expect(refreshCount).toBe(1);
    });
  });

  describe('authFetch', () => {
    beforeEach(() => {
      // Set valid token for authFetch tests
      setAccessToken('valid-token', 3600);
    });

    it('makes authenticated request with token', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      await authFetch('/api/test');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('throws error when not authenticated', async () => {
      clearAccessToken();
      
      // Mock refresh failure
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
        } as Response)
      );

      await expect(authFetch('/api/test')).rejects.toThrow('Not authenticated');
    });

    it('includes custom headers', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      await authFetch('/api/test', {
        headers: {
          'X-Custom-Header': 'custom-value',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
    });

    it('retries on 401 with token refresh', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call returns 401
          return Promise.resolve({
            ok: false,
            status: 401,
          } as Response);
        } else if (callCount === 2) {
          // Refresh call succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              accessToken: 'refreshed-token',
              expiresIn: 3600,
            }),
          } as Response);
        } else {
          // Retry with new token succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ data: 'success' }),
          } as Response);
        }
      });

      const result = await authFetch<{ data: string }>('/api/test');

      expect(result).toEqual({ data: 'success' });
      expect(callCount).toBe(3); // Original + refresh + retry
    });

    it('throws error after failed retry', async () => {
      let callCount = 0;
      global.fetch = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call returns 401
          return Promise.resolve({
            ok: false,
            status: 401,
          } as Response);
        } else if (callCount === 2) {
          // Refresh succeeds
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              accessToken: 'refreshed-token',
              expiresIn: 3600,
            }),
          } as Response);
        } else {
          // Retry still fails
          return Promise.resolve({
            ok: false,
            status: 403,
            json: () => Promise.resolve({ message: 'Forbidden' }),
          } as Response);
        }
      });

      await expect(authFetch('/api/test')).rejects.toThrow('Forbidden');
    });

    it('handles non-401 errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Server error' }),
        } as Response)
      );

      await expect(authFetch('/api/test')).rejects.toThrow('Server error');
    });

    it('handles errors without json body', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.reject(new Error('Not JSON')),
        } as Response)
      );

      await expect(authFetch('/api/test')).rejects.toThrow('Unknown error');
    });

    it('passes through request options', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      await authFetch('/api/test', {
        method: 'POST',
        body: JSON.stringify({ key: 'value' }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ key: 'value' }),
        })
      );
    });

    it('constructs full URL from endpoint', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: 'test' }),
        } as Response)
      );

      await authFetch('/api/test/123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/http:\/\/localhost:3003\/api\/test\/123$/),
        expect.any(Object)
      );
    });
  });

  describe('Authentication API', () => {
    it('registers new user', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              name: 'Test User',
              isGuest: false,
              preferences: { notifications: true, dataSharing: false, language: 'en' },
            },
            accessToken: 'new-token',
            expiresIn: 3600,
          }),
        } as Response)
      );

      const result = await register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.accessToken).toBe('new-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('handles registration failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ message: 'Email already exists' }),
        } as Response)
      );

      await expect(register({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      })).rejects.toThrow('Email already exists');
    });

    it('logs in user', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            user: {
              id: '123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              name: 'Test User',
              isGuest: false,
              preferences: { notifications: true, dataSharing: false, language: 'en' },
            },
            accessToken: 'login-token',
            expiresIn: 3600,
          }),
        } as Response)
      );

      const result = await login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('login-token');
      expect(isAuthenticated()).toBe(true);
    });

    it('handles login failure', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid credentials' }),
        } as Response)
      );

      await expect(login({
        email: 'test@example.com',
        password: 'wrong-password',
      })).rejects.toThrow('Invalid credentials');
    });

    it('logs out user', async () => {
      setAccessToken('test-token', 3600);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
        } as Response)
      );

      await logout();

      expect(isAuthenticated()).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    it('clears token even if logout fails', async () => {
      setAccessToken('test-token', 3600);

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await logout();

      expect(isAuthenticated()).toBe(false);
    });
  });
});

