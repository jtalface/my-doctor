// API client for webapp-backend
import { getAccessToken } from '../auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Types
export interface SessionNode {
  id: string;
  prompt: string;
  helpText?: string;
  inputType: 'choice' | 'text' | 'none';
  choices?: string[];
  isTerminal?: boolean;
  isRedFlag?: boolean;
}

export interface SessionProgress {
  current: number;
  total: number;
  percentage: number;
}

export interface SessionSummary {
  redFlags: string[];
  recommendations: string[];
  screenings: string[];
  notes: string;
}

export interface SessionResponse {
  sessionId: string;
  currentState: string;
  node: SessionNode;
  llmResponse?: string;
  progress: SessionProgress;
  summary?: SessionSummary;
  startedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  isGuest: boolean;
  preferences?: {
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

export interface LLMProvider {
  name: string;
  isAvailable: boolean;
  model?: string;
  url?: string;
}

export interface LLMStatus {
  activeProvider: string;
  providers: LLMProvider[];
}

export interface HealthStatus {
  status: string;
  stateMachine: {
    name: string;
    version: string;
    nodeCount: number;
  };
  llm: {
    activeProvider: string;
    providers: Array<{
      name: string;
      isAvailable: boolean;
    }>;
  };
}

export interface SessionHistoryItem {
  _id: string;
  currentState: string;
  status: 'active' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  summary?: SessionSummary;
}

// Dependent types
export type RelationshipType = 'parent' | 'guardian' | 'spouse' | 'sibling' | 'grandparent' | 'other';

export interface Dependent {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  preferences: {
    language: string;
    notifications: boolean;
    dataSharing: boolean;
  };
  relationship: RelationshipType;
  isPrimary: boolean;
  addedAt: string;
  hasProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerInfo {
  id: string;
  name: string;
  email: string;
  relationship: RelationshipType;
  isPrimary: boolean;
  addedAt: string;
}

export interface CreateDependentInput {
  name: string;
  dateOfBirth: string;
  relationship: RelationshipType;
  language?: string;
}

export interface UpdateDependentInput {
  name?: string;
  dateOfBirth?: string;
  language?: string;
}

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Make an unauthenticated request (for public endpoints like /health)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make an authenticated request (for protected endpoints)
   */
  private async authRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Health endpoints (PUBLIC - no auth required)
  async getHealth(): Promise<HealthStatus> {
    return this.request('/api/health');
  }

  async getLLMStatus(): Promise<LLMStatus> {
    return this.request('/api/health/llm');
  }

  async setLLMProvider(provider: string): Promise<LLMStatus> {
    return this.request('/api/health/llm/provider', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }

  // User endpoints (PROTECTED - auth required)
  async getUser(userId: string): Promise<User> {
    return this.authRequest(`/api/user/${userId}`);
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    return this.authRequest(`/api/user/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUserProfile(userId: string): Promise<PatientProfile> {
    return this.authRequest(`/api/user/${userId}/profile`);
  }

  async updateUserProfile(userId: string, updates: Partial<PatientProfile>): Promise<PatientProfile> {
    return this.authRequest(`/api/user/${userId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Session endpoints (PROTECTED - auth required)
  async startSession(userId: string): Promise<SessionResponse> {
    return this.authRequest('/api/session/start', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  async sendInput(sessionId: string, input: string): Promise<SessionResponse> {
    return this.authRequest(`/api/session/${sessionId}/input`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async getSession(sessionId: string): Promise<SessionResponse> {
    return this.authRequest(`/api/session/${sessionId}`);
  }

  async getUserSessions(userId: string): Promise<SessionHistoryItem[]> {
    return this.authRequest(`/api/session/user/${userId}`);
  }

  async abandonSession(sessionId: string): Promise<{ success: boolean }> {
    return this.authRequest(`/api/session/${sessionId}`, {
      method: 'DELETE',
    });
  }

  // Health record endpoints (PROTECTED - auth required)
  async getHealthRecord(userId: string): Promise<any> {
    return this.authRequest(`/api/health/record/${userId}`);
  }

  async addVital(
    userId: string,
    vital: { type: string; value: number | object; unit: string; source?: string }
  ): Promise<any> {
    return this.authRequest(`/api/health/record/${userId}/vital`, {
      method: 'POST',
      body: JSON.stringify(vital),
    });
  }

  async addHealthEvent(
    userId: string,
    event: { type: string; description: string; severity?: string; sessionId?: string }
  ): Promise<any> {
    return this.authRequest(`/api/health/record/${userId}/event`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  // ==========================================
  // DEPENDENT ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * Create a new dependent
   */
  async createDependent(input: CreateDependentInput): Promise<Dependent> {
    return this.authRequest('/api/dependents', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Get all dependents for the current user
   */
  async getDependents(): Promise<Dependent[]> {
    return this.authRequest('/api/dependents');
  }

  /**
   * Get a specific dependent by ID
   */
  async getDependent(dependentId: string): Promise<Dependent> {
    return this.authRequest(`/api/dependents/${dependentId}`);
  }

  /**
   * Update a dependent's basic info
   */
  async updateDependent(dependentId: string, updates: UpdateDependentInput): Promise<Dependent> {
    return this.authRequest(`/api/dependents/${dependentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a dependent and all their data
   */
  async deleteDependent(dependentId: string): Promise<{ success: boolean; message: string }> {
    return this.authRequest(`/api/dependents/${dependentId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all managers of a dependent
   */
  async getDependentManagers(dependentId: string): Promise<ManagerInfo[]> {
    return this.authRequest(`/api/dependents/${dependentId}/managers`);
  }

  /**
   * Add a manager to a dependent
   */
  async addDependentManager(
    dependentId: string,
    emailOrId: string,
    relationship: RelationshipType
  ): Promise<{ success: boolean; message: string }> {
    // Determine if it's an email or ID
    const isEmail = emailOrId.includes('@');
    const body = isEmail 
      ? { email: emailOrId, relationship }
      : { managerId: emailOrId, relationship };
    
    return this.authRequest(`/api/dependents/${dependentId}/managers`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /**
   * Remove a manager from a dependent
   */
  async removeDependentManager(
    dependentId: string,
    managerId: string
  ): Promise<{ success: boolean; message: string; dependentDeleted?: boolean }> {
    return this.authRequest(`/api/dependents/${dependentId}/managers/${managerId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Update relationship type with a dependent
   */
  async updateDependentRelationship(
    dependentId: string,
    relationship: RelationshipType
  ): Promise<Dependent> {
    return this.authRequest(`/api/dependents/${dependentId}/relationship`, {
      method: 'PATCH',
      body: JSON.stringify({ relationship }),
    });
  }

  /**
   * Get dependent's health profile
   */
  async getDependentProfile(dependentId: string): Promise<PatientProfile> {
    return this.authRequest(`/api/dependents/${dependentId}/profile`);
  }

  /**
   * Update dependent's health profile
   */
  async updateDependentProfile(
    dependentId: string,
    updates: Partial<PatientProfile>
  ): Promise<PatientProfile> {
    return this.authRequest(`/api/dependents/${dependentId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get dependent's session history
   */
  async getDependentSessions(
    dependentId: string,
    options?: { limit?: number; skip?: number }
  ): Promise<SessionHistoryItem[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.skip) params.set('skip', options.skip.toString());
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/api/dependents/${dependentId}/sessions?${queryString}`
      : `/api/dependents/${dependentId}/sessions`;
    
    return this.authRequest(endpoint);
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export class for testing or custom instances
export { ApiClient };
