/**
 * API Service
 * 
 * Centralized API client for doctor-backend.
 */

import type { 
  Doctor, 
  LoginCredentials, 
  RegisterData, 
  AuthResponse 
} from '../auth/types';

const API_BASE = '/api';

// Token storage
let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// Request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle token refresh on 401
  if (response.status === 401 && endpoint !== '/auth/refresh') {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (!retryResponse.ok) {
        const error = await retryResponse.json();
        throw new Error(error.message || 'Request failed');
      }
      return retryResponse.json();
    }
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Auth API
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  setAccessToken(response.accessToken);
  return response;
}

export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
  setAccessToken(null);
}

export async function refreshToken(): Promise<boolean> {
  try {
    const data = await request<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
    });
    setAccessToken(data.accessToken);
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}

export async function getMe(): Promise<{ doctor: Doctor }> {
  return request('/auth/me');
}

// Profile API
export interface DoctorProfile {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual: firstName + lastName
  email: string;
  specialty: string;
  title?: string;
  licenseNumber?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  languages: string[];
  isActive: boolean;
  isAvailable: boolean;
  isVerified: boolean;
  workingHours?: {
    start: string;
    end: string;
    timezone: string;
    daysOfWeek: number[];
  };
  preferences?: {
    notifications: boolean;
    emailAlerts: boolean;
    language: string;
  };
}

export async function getProfile(): Promise<{ profile: DoctorProfile }> {
  return request('/profile');
}

export async function updateProfile(data: Partial<DoctorProfile>): Promise<{ profile: DoctorProfile }> {
  return request('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function updateAvailability(isAvailable: boolean): Promise<{ isAvailable: boolean }> {
  return request('/profile/availability', {
    method: 'POST',
    body: JSON.stringify({ isAvailable }),
  });
}

// Conversations API
export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual
  email?: string;
}

export interface Conversation {
  _id: string;
  patient: Patient;
  dependent?: { _id: string; name: string } | null;
  subject?: string;
  lastMessageAt: string;
  lastMessagePreview: string;
  lastMessageSenderType: 'patient' | 'provider';
  unreadCount: number;
  status: 'active' | 'archived' | 'closed';
  createdAt: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getConversations(
  page = 1,
  status = 'active'
): Promise<ConversationsResponse> {
  return request(`/conversations?page=${page}&status=${status}`);
}

export async function getConversation(id: string): Promise<{ conversation: Conversation }> {
  return request(`/conversations/${id}`);
}

export async function markConversationRead(id: string): Promise<{ success: boolean }> {
  return request(`/conversations/${id}/read`, { method: 'POST' });
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return request('/conversations/unread/count');
}

// Messages API
export interface Attachment {
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
  attachments: Attachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export async function getMessages(conversationId: string): Promise<{ messages: Message[] }> {
  return request(`/messages/conversations/${conversationId}/messages`);
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachments?: File[]
): Promise<{ message: Message }> {
  if (attachments && attachments.length > 0) {
    const formData = new FormData();
    formData.append('content', content);
    attachments.forEach(file => formData.append('attachments', file));

    const response = await fetch(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send message');
    }

    return response.json();
  }

  return request(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function downloadFile(url: string): Promise<Blob> {
  const response = await fetch(url, {
    headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {},
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  return response.blob();
}

// Patients API
export interface PatientProfile {
  _id: string;
  firstName: string;
  lastName: string;
  name: string; // Virtual
  email?: string;
  profile?: {
    demographics?: {
      dateOfBirth?: string;
      age?: number;
      sexAtBirth?: 'male' | 'female' | 'other';
      race?: 'black' | 'white' | 'asian' | 'latin_american' | 'mixed' | 'other' | 'prefer_not_to_say';
      heightCm?: number;
      weightKg?: number;
    };
    medicalHistory?: {
      chronicConditions?: string[];
      allergies?: string[];
      medications?: string[];
      surgeries?: string[];
      familyHistory?: string[];
    };
    lifestyle?: {
      smoking?: 'never' | 'former' | 'current';
      alcohol?: 'never' | 'occasional' | 'regular' | 'heavy';
      exercise?: 'sedentary' | 'light' | 'moderate' | 'active';
      diet?: string;
    };
  };
}

export async function getPatients(): Promise<{ patients: Patient[] }> {
  return request('/patients');
}

export async function getPatientProfile(id: string): Promise<{ patient: PatientProfile }> {
  return request(`/patients/${id}/profile`);
}

export async function getPatientHistory(id: string): Promise<{
  conversations: Array<{
    _id: string;
    subject?: string;
    status: string;
    messageCount: number;
    createdAt: string;
    lastMessageAt: string;
  }>;
}> {
  return request(`/patients/${id}/history`);
}

