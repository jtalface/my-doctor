/**
 * Auth Service
 * 
 * Handles authentication API calls and token management.
 * Access tokens are stored in memory, refresh tokens in httpOnly cookies (server-side).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Types
export interface AuthUser {
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

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  language?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Token storage (in memory for security)
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Get the current access token, refreshing if needed
 */
export async function getAccessToken(): Promise<string | null> {
  // If no token, try to refresh
  if (!accessToken) {
    return refreshAccessToken();
  }

  // If token is about to expire (within 60 seconds), refresh
  if (tokenExpiresAt && Date.now() > tokenExpiresAt - 60000) {
    return refreshAccessToken();
  }

  return accessToken;
}

/**
 * Set access token (called after login/register)
 */
export function setAccessToken(token: string, expiresIn: number): void {
  accessToken = token;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
}

/**
 * Clear access token (called after logout)
 */
export function clearAccessToken(): void {
  accessToken = null;
  tokenExpiresAt = null;
}

/**
 * Check if user is authenticated (has a valid token)
 */
export function isAuthenticated(): boolean {
  return !!accessToken && (!tokenExpiresAt || Date.now() < tokenExpiresAt);
}

/**
 * Refresh the access token using the refresh token in the httpOnly cookie
 */
async function refreshAccessToken(): Promise<string | null> {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Refresh failed - user needs to login again
        clearAccessToken();
        return null;
      }

      const data: RefreshResponse = await response.json();
      setAccessToken(data.accessToken, data.expiresIn);
      return data.accessToken;
    } catch (error) {
      console.error('[Auth] Token refresh failed:', error);
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an authenticated request
 */
export async function authFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  // If unauthorized, try refreshing token and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (!newToken) {
      throw new Error('Session expired. Please login again.');
    }

    // Retry with new token
    const retryResponse = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${newToken}`,
        ...options.headers,
      },
    });

    if (!retryResponse.ok) {
      const error = await retryResponse.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${retryResponse.status}`);
    }

    return retryResponse.json();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth API calls

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  const result: AuthResponse = await response.json();
  setAccessToken(result.accessToken, result.expiresIn);
  return result;
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  const result: AuthResponse = await response.json();
  setAccessToken(result.accessToken, result.expiresIn);
  return result;
}

/**
 * Logout current session
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Auth] Logout error:', error);
  } finally {
    clearAccessToken();
  }
}

/**
 * Logout from all devices
 */
export async function logoutAll(): Promise<void> {
  try {
    await authFetch('/api/auth/logout-all', { method: 'POST' });
  } catch (error) {
    console.error('[Auth] Logout all error:', error);
  } finally {
    clearAccessToken();
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await authFetch<{ user: AuthUser }>('/api/auth/me');
  return response.user;
}

/**
 * Check if email is already registered
 */
export async function checkEmail(email: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  return data.exists;
}

/**
 * Get password requirements
 */
export async function getPasswordRequirements(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/api/auth/password-requirements`);
  const data = await response.json();
  return data.requirements || [];
}

/**
 * Try to restore session from refresh token
 */
export async function tryRestoreSession(): Promise<AuthUser | null> {
  try {
    const token = await refreshAccessToken();
    if (!token) {
      return null;
    }
    return getCurrentUser();
  } catch (error) {
    console.error('[Auth] Session restore failed:', error);
    return null;
  }
}

