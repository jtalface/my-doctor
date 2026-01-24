/**
 * Cycle Tracking API Service
 * 
 * This module is code-split and only loaded when accessing cycle tracking features.
 * It handles all API communication for period tracking, predictions, and insights.
 */

import { authFetch } from '../auth/authService';
import type {
  CycleSettings,
  DailyLog,
  Cycle,
  Prediction,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  CreateDailyLogRequest,
  ExportData,
  ImportDataRequest,
  ImportDataResponse,
  DeleteAllDataResponse,
} from '../types/cycle';

/**
 * API Error with status code
 */
export class CycleApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'CycleApiError';
  }
}

/**
 * Build URL with optional userId query parameter
 */
function buildUrl(path: string, userId?: string, queryParams?: Record<string, string>): string {
  const params = new URLSearchParams();
  
  if (userId) {
    params.set('userId', userId);
  }
  
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      params.set(key, value);
    });
  }
  
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

// ==================== SETTINGS ====================

export async function getSettings(userId?: string): Promise<CycleSettings | null> {
  try {
    return await authFetch<CycleSettings>(buildUrl('/api/cycle/settings', userId));
  } catch (error: any) {
    // Handle "not found" responses - settings don't exist yet (user needs to onboard)
    const message = error.message?.toLowerCase() || '';
    if (
      message.includes('404') || 
      message.includes('not found') ||
      error.statusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function createSettings(
  data: CreateSettingsRequest,
  userId?: string
): Promise<CycleSettings> {
  return authFetch<CycleSettings>(buildUrl('/api/cycle/settings', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSettings(
  data: UpdateSettingsRequest,
  userId?: string
): Promise<CycleSettings> {
  return authFetch<CycleSettings>(buildUrl('/api/cycle/settings', userId), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ==================== DAILY LOGS ====================

export async function createOrUpdateDailyLog(
  data: CreateDailyLogRequest,
  userId?: string
): Promise<DailyLog> {
  return authFetch<DailyLog>(buildUrl('/api/cycle/logs', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getDailyLogs(
  startDate: string,
  endDate: string,
  userId?: string
): Promise<DailyLog[]> {
  return authFetch<DailyLog[]>(
    buildUrl('/api/cycle/logs', userId, { startDate, endDate })
  );
}

export async function deleteDailyLog(date: string, userId?: string): Promise<{ success: boolean }> {
  return authFetch<{ success: boolean }>(buildUrl(`/api/cycle/logs/${date}`, userId), {
    method: 'DELETE',
  });
}

// ==================== CYCLES ====================

export async function getCycles(userId?: string): Promise<Cycle[]> {
  return authFetch<Cycle[]>(buildUrl('/api/cycle/cycles', userId));
}

export async function getPredictions(userId?: string): Promise<Prediction> {
  return authFetch<Prediction>(buildUrl('/api/cycle/predictions', userId));
}

// ==================== EXPORT / IMPORT ====================

export async function exportData(userId?: string): Promise<ExportData> {
  return authFetch<ExportData>(buildUrl('/api/cycle/export', userId));
}

export async function importData(
  data: ImportDataRequest,
  userId?: string
): Promise<ImportDataResponse> {
  return authFetch<ImportDataResponse>(buildUrl('/api/cycle/import', userId), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAllData(userId?: string): Promise<DeleteAllDataResponse> {
  return authFetch<DeleteAllDataResponse>(buildUrl('/api/cycle/all', userId), {
    method: 'DELETE',
  });
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Download export data as JSON file
 */
export function downloadExportFile(data: ExportData, filename?: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `cycle-data-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Read and parse uploaded JSON file
 */
export function readImportFile(file: File): Promise<ImportDataRequest> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

