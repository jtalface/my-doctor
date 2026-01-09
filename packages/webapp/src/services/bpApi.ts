/**
 * BP API Service
 * 
 * Frontend service for interacting with blood pressure tracking API
 * Uses authFetch for automatic JWT token inclusion
 */

import { authFetch } from '../auth/authService';
import type {
  BPSettings,
  CreateSettingsRequest,
  BPSession,
  CreateSessionRequest,
  BPSuggestion,
  BPPatternAnalysis,
  BPExportData,
} from '../types/bp';

const API_BASE = '/api/bp';

/**
 * Build URL with optional userId query parameter (for dependents)
 */
function buildUrl(path: string, userId?: string): string {
  const url = `${API_BASE}${path}`;
  if (userId) {
    return `${url}${path.includes('?') ? '&' : '?'}userId=${userId}`;
  }
  return url;
}

// ==================== SETTINGS ====================

export async function getSettings(userId?: string): Promise<BPSettings | null> {
  try {
    return await authFetch<BPSettings>(buildUrl('/settings', userId));
  } catch (error: any) {
    if (error.message?.includes('404') || error.statusCode === 404) {
      return null; // Settings not found, user needs onboarding
    }
    throw error;
  }
}

export async function createSettings(
  data: CreateSettingsRequest,
  userId?: string
): Promise<BPSettings> {
  return await authFetch<BPSettings>(buildUrl('/settings', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSettings(
  updates: Partial<BPSettings>,
  userId?: string
): Promise<BPSettings> {
  return await authFetch<BPSettings>(buildUrl('/settings', userId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ==================== SESSIONS ====================

export async function createSession(
  data: CreateSessionRequest,
  userId?: string
): Promise<BPSession> {
  return await authFetch<BPSession>(buildUrl('/sessions', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface GetSessionsOptions {
  startDate?: Date;
  endDate?: Date;
  context?: string;
  classification?: string;
  limit?: number;
  userId?: string;
}

export async function getSessions(options: GetSessionsOptions = {}): Promise<BPSession[]> {
  const params = new URLSearchParams();

  if (options.userId) {
    params.append('userId', options.userId);
  }
  if (options.startDate) {
    params.append('startDate', options.startDate.toISOString());
  }
  if (options.endDate) {
    params.append('endDate', options.endDate.toISOString());
  }
  if (options.context) {
    params.append('context', options.context);
  }
  if (options.classification) {
    params.append('classification', options.classification);
  }
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  const url = `${API_BASE}/sessions${params.toString() ? `?${params.toString()}` : ''}`;
  return await authFetch<BPSession[]>(url);
}

export async function updateSession(
  sessionId: string,
  updates: Partial<BPSession>,
  userId?: string
): Promise<BPSession> {
  const url = userId ? `/sessions/${sessionId}?userId=${userId}` : `/sessions/${sessionId}`;
  return await authFetch<BPSession>(`${API_BASE}${url}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteSession(sessionId: string, userId?: string): Promise<void> {
  const url = userId ? `/sessions/${sessionId}?userId=${userId}` : `/sessions/${sessionId}`;
  await authFetch<{ success: boolean }>(`${API_BASE}${url}`, {
    method: 'DELETE',
  });
}

// ==================== SUGGESTIONS ====================

export async function getSuggestions(userId?: string): Promise<BPSuggestion[]> {
  return await authFetch<BPSuggestion[]>(buildUrl('/suggestions', userId));
}

// ==================== ANALYTICS ====================

export async function getAnalytics(days: number = 7, userId?: string): Promise<BPPatternAnalysis> {
  const url = buildUrl('/analytics', userId);
  const urlWithDays = `${url}${url.includes('?') ? '&' : '?'}days=${days}`;
  return await authFetch<BPPatternAnalysis>(urlWithDays);
}

// ==================== EXPORT / DELETE ====================

export async function exportData(userId?: string): Promise<BPExportData> {
  return await authFetch<BPExportData>(buildUrl('/export', userId));
}

export async function deleteAllData(userId?: string): Promise<{
  settingsDeleted: number;
  sessionsDeleted: number;
  suggestionsDeleted: number;
}> {
  return await authFetch<any>(buildUrl('/all', userId), {
    method: 'DELETE',
  });
}

