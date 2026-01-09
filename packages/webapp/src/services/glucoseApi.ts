/**
 * Glucose API Service
 * 
 * Frontend service for interacting with glucose tracking API
 * Uses authFetch for automatic JWT token inclusion
 */

import { authFetch } from '../auth/authService';
import type {
  GlucoseSettings,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  GlucoseReading,
  CreateReadingRequest,
  UpdateReadingRequest,
  OtherMetrics,
  CreateMetricsRequest,
  Suggestion,
  PatternAnalysis,
  ExportData,
} from '../types/glucose';

const API_BASE = '/api/glucose';

/**
 * Build URL with optional userId query parameter
 */
function buildUrl(path: string, userId?: string): string {
  const url = `${API_BASE}${path}`;
  if (userId) {
    return `${url}?userId=${userId}`;
  }
  return url;
}

// ==================== SETTINGS ====================

export async function getSettings(userId?: string): Promise<GlucoseSettings | null> {
  try {
    return await authFetch<GlucoseSettings>(buildUrl('/settings', userId));
  } catch (error: any) {
    if (error.message?.includes('404') || error.statusCode === 404) {
      return null; // Settings not found, user needs to complete onboarding
    }
    throw error;
  }
}

export async function createSettings(
  data: CreateSettingsRequest,
  userId?: string
): Promise<GlucoseSettings> {
  return await authFetch<GlucoseSettings>(buildUrl('/settings', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSettings(
  updates: UpdateSettingsRequest,
  userId?: string
): Promise<GlucoseSettings> {
  return await authFetch<GlucoseSettings>(buildUrl('/settings', userId), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ==================== READINGS ====================

export async function createReading(
  data: CreateReadingRequest,
  userId?: string
): Promise<GlucoseReading> {
  return await authFetch<GlucoseReading>(buildUrl('/readings', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface GetReadingsOptions {
  startDate?: Date;
  endDate?: Date;
  context?: string;
  limit?: number;
  userId?: string;
}

export async function getReadings(options: GetReadingsOptions = {}): Promise<GlucoseReading[]> {
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
  if (options.limit) {
    params.append('limit', options.limit.toString());
  }

  const url = `${API_BASE}/readings${params.toString() ? `?${params.toString()}` : ''}`;
  return await authFetch<GlucoseReading[]>(url);
}

export async function updateReading(
  readingId: string,
  updates: UpdateReadingRequest,
  userId?: string
): Promise<GlucoseReading> {
  const url = userId ? `/readings/${readingId}?userId=${userId}` : `/readings/${readingId}`;
  return await authFetch<GlucoseReading>(`${API_BASE}${url}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteReading(readingId: string, userId?: string): Promise<void> {
  const url = userId ? `/readings/${readingId}?userId=${userId}` : `/readings/${readingId}`;
  await authFetch<{ success: boolean }>(`${API_BASE}${url}`, {
    method: 'DELETE',
  });
}

// ==================== SUGGESTIONS ====================

export async function getSuggestions(userId?: string): Promise<Suggestion[]> {
  return await authFetch<Suggestion[]>(buildUrl('/suggestions', userId));
}

// ==================== ANALYTICS ====================

export async function getAnalytics(days: number = 7, userId?: string): Promise<PatternAnalysis> {
  const url = buildUrl('/analytics', userId);
  const urlWithDays = `${url}${url.includes('?') ? '&' : '?'}days=${days}`;
  return await authFetch<PatternAnalysis>(urlWithDays);
}

// ==================== OTHER METRICS ====================

export async function createOrUpdateMetrics(
  data: CreateMetricsRequest,
  userId?: string
): Promise<OtherMetrics> {
  return await authFetch<OtherMetrics>(buildUrl('/metrics', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface GetMetricsOptions {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
}

export async function getMetrics(options: GetMetricsOptions = {}): Promise<OtherMetrics[]> {
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

  const url = `${API_BASE}/metrics${params.toString() ? `?${params.toString()}` : ''}`;
  return await authFetch<OtherMetrics[]>(url);
}

// ==================== EXPORT / DELETE ====================

export async function exportData(userId?: string): Promise<ExportData> {
  return await authFetch<ExportData>(buildUrl('/export', userId));
}

export async function deleteAllData(userId?: string): Promise<{
  settingsDeleted: number;
  readingsDeleted: number;
  metricsDeleted: number;
  suggestionsDeleted: number;
}> {
  return await authFetch<any>(buildUrl('/all', userId), {
    method: 'DELETE',
  });
}

