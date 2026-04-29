// API client for webapp-backend
import { getAccessToken } from '../auth/authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
export type CheckupSessionType = 'annual-checkup' | 'symptom-check' | 'medication-review';

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
  sessionType?: CheckupSessionType;
  currentState: string;
  node: SessionNode;
  llmResponse?: string;
  progress: SessionProgress;
  summary?: SessionSummary;
  startedAt?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual: firstName + lastName
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
    race?: 'black' | 'white' | 'asian' | 'latin_american' | 'mixed' | 'other' | 'prefer_not_to_say';
    ethnicGroup?: string;
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
  sessionType?: CheckupSessionType;
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

// ==========================================
// VACCINATION TYPES
// ==========================================

export type VaccinationStatus = 'yes' | 'no' | 'unknown';

export interface VaccineDose {
  id: string;
  vaccineId: string;
  vaccineName: string;
  vaccineAbbrev: string;
  doseNumber: number;
  totalDoses: number;
  ageMonths: number;
  ageLabel: string;
  description?: string;
  isVitaminOrSupplement: boolean;
}

export interface VaccinationRecord {
  doseId: string;
  status: VaccinationStatus;
  dateAdministered?: string;
  notes?: string;
}

export interface VaccinationFormSchema {
  country: string;
  countryCode: string;
  version: string;
  lastUpdated: string;
  doses: VaccineDose[];
}

export interface VaccinationStatus_Response {
  applicable: boolean;
  dependentId?: string;
  dependentName?: string;
  ageMonths?: number;
  ageYears?: number;
  country?: string;
  records: VaccinationRecord[];
  relevantDoses: VaccineDose[];
  overdueDoses: VaccineDose[];
  progress: number;
  hasRecords: boolean;
  needsAttention: boolean;
  schema?: VaccinationFormSchema;
  message?: string;
}

export interface VaccinationUpdateResponse {
  success: boolean;
  records: VaccinationRecord[];
  overdueDoses: VaccineDose[];
  progress: number;
  needsAttention: boolean;
}

// Messaging types
export interface Provider {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual: firstName + lastName
  email: string;
  specialty: string;
  title?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  languages: string[];
  isActive: boolean;
  isAvailable: boolean;
  isOnline: boolean;
  lastActiveAt?: string;
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
    daysOfWeek: number[];
  };
}

export interface Conversation {
  _id: string;
  patientId: string;
  providerId: string;
  provider?: Provider;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderType: 'patient' | 'provider';
  unreadByPatient: number;
  unreadByProvider: number;
  status: 'active' | 'archived' | 'closed';
  subject?: string;
  dependentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderType: 'patient' | 'provider';
  senderId: string;
  content: string;
  attachments: MessageAttachment[];
  readAt?: string;
  editedAt?: string;
  deletedAt?: string;
  isSystemMessage: boolean;
  systemMessageType?: string;
  createdAt: string;
  updatedAt: string;
  hasAttachments?: boolean;
  isDeleted?: boolean;
}

// API Client class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async extractErrorMessage(response: Response): Promise<string> {
    try {
      const data = await response.json();
      if (typeof data?.error === 'string' && data.error.trim()) {
        return data.error;
      }
      if (typeof data?.message === 'string' && data.message.trim()) {
        return data.message;
      }
      if (typeof data?.details === 'string' && data.details.trim()) {
        return data.details;
      }
    } catch {
      // Fall through to text/status fallback.
    }

    try {
      const text = await response.text();
      if (text.trim()) {
        return text.trim();
      }
    } catch {
      // Fall through to status fallback.
    }

    return `HTTP ${response.status}`;
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
      const message = await this.extractErrorMessage(response);
      throw new Error(message);
    }

    return response.json();
  }

  /**
   * Make an authenticated request (for protected endpoints)
   */
  private async authRequest<T>(
    endpoint: string,
    options: RequestInit & { isFormData?: boolean } = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Don't set Content-Type for FormData - browser sets it with boundary
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
    };
    
    if (!options.isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const message = await this.extractErrorMessage(response);
      throw new Error(message);
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
  async startSession(userId: string, sessionType: CheckupSessionType = 'annual-checkup'): Promise<SessionResponse> {
    return this.authRequest('/api/session/start', {
      method: 'POST',
      body: JSON.stringify({ userId, sessionType }),
    });
  }

  async sendInput(sessionId: string, input: string): Promise<SessionResponse> {
    return this.authRequest(`/api/session/${sessionId}/input`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  }

  async backSession(sessionId: string): Promise<SessionResponse> {
    return this.authRequest(`/api/session/${sessionId}/back`, {
      method: 'POST',
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

  // ==========================================
  // VACCINATION ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * Get vaccination schema for a country
   */
  async getVaccinationSchema(country: string = 'moz'): Promise<{ schema: VaccinationFormSchema }> {
    return this.authRequest(`/api/vaccination/schema/${country}`);
  }

  /**
   * Get vaccination status and records for a dependent
   */
  async getDependentVaccinationStatus(dependentId: string): Promise<VaccinationStatus_Response> {
    return this.authRequest(`/api/vaccination/dependent/${dependentId}`);
  }

  /**
   * Update vaccination records for a dependent (batch update)
   */
  async updateDependentVaccinationRecords(
    dependentId: string,
    records: VaccinationRecord[]
  ): Promise<VaccinationUpdateResponse> {
    return this.authRequest(`/api/vaccination/dependent/${dependentId}`, {
      method: 'PUT',
      body: JSON.stringify({ records }),
    });
  }

  /**
   * Update a single vaccination dose record
   */
  async updateDependentVaccinationDose(
    dependentId: string,
    doseId: string,
    status: VaccinationStatus,
    dateAdministered?: string,
    notes?: string
  ): Promise<{ success: boolean; record: VaccinationRecord }> {
    return this.authRequest(`/api/vaccination/dependent/${dependentId}/dose/${doseId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, dateAdministered, notes }),
    });
  }

  // ==========================================
  // MESSAGING ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * Get list of available healthcare providers
   */
  async getProviders(): Promise<Provider[]> {
    return this.authRequest('/api/messages/providers');
  }

  /**
   * Get a specific provider
   */
  async getProvider(providerId: string): Promise<Provider> {
    return this.authRequest(`/api/messages/providers/${providerId}`);
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(dependentId?: string): Promise<Conversation[]> {
    const params = dependentId ? `?dependentId=${dependentId}` : '';
    return this.authRequest(`/api/messages/conversations${params}`);
  }

  /**
   * Create a new conversation with a provider
   */
  async createConversation(
    providerId: string,
    options?: { subject?: string; dependentId?: string }
  ): Promise<Conversation> {
    return this.authRequest('/api/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ providerId, ...options }),
    });
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    return this.authRequest(`/api/messages/conversations/${conversationId}`);
  }

  /**
   * Update a conversation (archive, close, etc.)
   */
  async updateConversation(
    conversationId: string,
    updates: { status?: 'active' | 'archived' | 'closed'; subject?: string }
  ): Promise<Conversation> {
    return this.authRequest(`/api/messages/conversations/${conversationId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<{ success: boolean }> {
    return this.authRequest(`/api/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    });
  }

  /**
   * Get messages in a conversation (paginated)
   */
  async getMessages(
    conversationId: string,
    options?: { limit?: number; before?: string; after?: string }
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.before) params.set('before', options.before);
    if (options?.after) params.set('after', options.after);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `/api/messages/conversations/${conversationId}/messages?${queryString}`
      : `/api/messages/conversations/${conversationId}/messages`;
    
    return this.authRequest(endpoint);
  }

  /**
   * Send a message (text only)
   */
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const formData = new FormData();
    formData.append('content', content);
    
    return this.authRequest(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  /**
   * Send a message with attachments
   */
  async sendMessageWithAttachments(
    conversationId: string,
    content: string,
    files: File[]
  ): Promise<Message> {
    const formData = new FormData();
    formData.append('content', content);
    files.forEach(file => formData.append('attachments', file));
    
    return this.authRequest(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{ success: boolean }> {
    return this.authRequest(`/api/messages/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get messaging stats (unread count, etc.)
   */
  async getMessagingStats(): Promise<{ totalConversations: number; unreadMessages: number }> {
    return this.authRequest('/api/messages/stats');
  }

  /**
   * Get file download URL
   */
  getFileDownloadUrl(filename: string): string {
    return `${this.baseUrl}/api/messages/files/${filename}`;
  }

  /**
   * Download a file as blob (for authenticated image display)
   */
  async downloadFileAsBlob(filename: string): Promise<Blob> {
    const url = `${this.baseUrl}/api/messages/files/${filename}`;
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }

    return response.blob();
  }

  // ==========================================
  // CALL ENDPOINTS (PROTECTED)
  // ==========================================

  /**
   * Initiate a call
   */
  async initiateCall(conversationId: string): Promise<{ callId: string; status: string }> {
    return this.authRequest('/api/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });
  }

  /**
   * Check for incoming calls
   */
  async checkIncomingCall(): Promise<{
    hasIncomingCall: boolean;
    call?: {
      callId: string;
      conversationId: string;
      callerName: string;
      callerPhone?: string;
      callerType: 'patient' | 'provider';
      status: string;
      initiatedAt: string;
      offer?: RTCSessionDescriptionInit;
    };
  }> {
    return this.authRequest('/api/calls/incoming');
  }

  /**
   * Get call status
   */
  async getCallStatus(callId: string, lastIceIndex: number = 0): Promise<{
    callId: string;
    conversationId: string;
    status: string;
    endReason?: string;
    isCaller: boolean;
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    iceCandidates: RTCIceCandidateInit[];
    iceIndex: number;
    initiatedAt: string;
    answeredAt?: string;
    duration?: number;
  }> {
    return this.authRequest(`/api/calls/${callId}?lastIceIndex=${lastIceIndex}`);
  }

  /**
   * Send WebRTC offer
   */
  async sendOffer(callId: string, offer: RTCSessionDescriptionInit): Promise<{ success: boolean }> {
    return this.authRequest(`/api/calls/${callId}/offer`, {
      method: 'POST',
      body: JSON.stringify({ offer }),
    });
  }

  /**
   * Send WebRTC answer
   */
  async sendAnswer(callId: string, answer: RTCSessionDescriptionInit): Promise<{ success: boolean }> {
    return this.authRequest(`/api/calls/${callId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  }

  /**
   * Send ICE candidate
   */
  async sendIceCandidate(callId: string, candidate: RTCIceCandidateInit): Promise<{ success: boolean }> {
    return this.authRequest(`/api/calls/${callId}/ice`, {
      method: 'POST',
      body: JSON.stringify({ candidate }),
    });
  }

  /**
   * Decline an incoming call
   */
  async declineCall(callId: string): Promise<{ success: boolean }> {
    return this.authRequest(`/api/calls/${callId}/decline`, {
      method: 'POST',
    });
  }

  /**
   * End a call
   */
  async endCall(callId: string, reason?: string): Promise<{ success: boolean; duration?: number }> {
    return this.authRequest(`/api/calls/${callId}/end`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  /**
   * Mark that fallback (phone call) was used
   */
  async markCallFallback(callId: string): Promise<{ success: boolean }> {
    return this.authRequest(`/api/calls/${callId}/fallback`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export class for testing or custom instances
export { ApiClient };
