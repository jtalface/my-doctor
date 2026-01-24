/**
 * useCycleData Hook
 * 
 * Central hook for managing all cycle tracking data:
 * - Settings (cycle configuration)
 * - Daily logs (symptoms, mood, flow)
 * - Cycles (historical periods)
 * - Predictions (next period, fertile window)
 * 
 * Supports tracking for self and dependents via userId parameter.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  CycleSettings,
  DailyLog,
  Cycle,
  Prediction,
  CreateSettingsRequest,
  UpdateSettingsRequest,
  CreateDailyLogRequest,
} from '../types/cycle';

// Lazy import cycleApi for code splitting
let cycleApi: typeof import('../services/cycleApi') | null = null;

async function getCycleApi() {
  if (!cycleApi) {
    cycleApi = await import('../services/cycleApi');
  }
  return cycleApi;
}

interface UseCycleDataOptions {
  userId?: string;                      // If provided, track for dependent
  autoLoad?: boolean;                   // Auto-load data on mount (default: true)
}

interface UseCycleDataReturn {
  // Data
  settings: CycleSettings | null;
  dailyLogs: DailyLog[];
  cycles: Cycle[];
  predictions: Prediction | null;
  
  // Loading states
  isLoading: boolean;
  isLoadingSettings: boolean;
  isLoadingLogs: boolean;
  isLoadingCycles: boolean;
  isLoadingPredictions: boolean;
  
  // Errors
  error: string | null;
  
  // Actions
  loadSettings: () => Promise<void>;
  createSettings: (data: CreateSettingsRequest) => Promise<void>;
  updateSettings: (data: UpdateSettingsRequest) => Promise<void>;
  
  loadDailyLogs: (startDate: string, endDate: string) => Promise<void>;
  createOrUpdateLog: (data: CreateDailyLogRequest) => Promise<void>;
  deleteLog: (date: string) => Promise<void>;
  
  loadCycles: () => Promise<void>;
  loadPredictions: () => Promise<void>;
  
  reload: () => Promise<void>;          // Reload all data
}

export function useCycleData(options: UseCycleDataOptions = {}): UseCycleDataReturn {
  const { userId, autoLoad = true } = options;
  
  // Data state
  const [settings, setSettings] = useState<CycleSettings | null>(null);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [predictions, setPredictions] = useState<Prediction | null>(null);
  
  // Loading state
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingCycles, setIsLoadingCycles] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  const isLoading = isLoadingSettings || isLoadingLogs || isLoadingCycles || isLoadingPredictions;
  
  // ==================== SETTINGS ====================
  
  const loadSettings = useCallback(async (): Promise<CycleSettings | null> => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const data = await api.getSettings(userId);
      setSettings(data);
      return data;
    } catch (err) {
      // Only log unexpected errors, not "settings not found" which is expected before onboarding
      console.error('Failed to load cycle settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load settings');
      return null;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [userId]);
  
  const createSettings = useCallback(async (data: CreateSettingsRequest) => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const created = await api.createSettings(data, userId);
      setSettings(created);
    } catch (err) {
      console.error('Failed to create cycle settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to create settings');
      throw err;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [userId]);
  
  const updateSettings = useCallback(async (data: UpdateSettingsRequest) => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const updated = await api.updateSettings(data, userId);
      setSettings(updated);
      
      // Reload predictions since settings changed
      await loadPredictions();
    } catch (err) {
      console.error('Failed to update cycle settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      throw err;
    } finally {
      setIsLoadingSettings(false);
    }
  }, [userId]);
  
  // ==================== DAILY LOGS ====================
  
  const loadDailyLogs = useCallback(async (startDate: string, endDate: string) => {
    setIsLoadingLogs(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const logs = await api.getDailyLogs(startDate, endDate, userId);
      setDailyLogs(logs);
    } catch (err) {
      console.error('Failed to load daily logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setIsLoadingLogs(false);
    }
  }, [userId]);
  
  const createOrUpdateLog = useCallback(async (data: CreateDailyLogRequest) => {
    setError(null);
    
    try {
      const api = await getCycleApi();
      const log = await api.createOrUpdateDailyLog(data, userId);
      
      // Update local state
      setDailyLogs(prev => {
        const index = prev.findIndex(l => l.date === log.date);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = log;
          return updated;
        }
        return [...prev, log].sort((a, b) => a.date.localeCompare(b.date));
      });
      
      // Reload cycles and predictions as they might have changed
      await Promise.all([loadCycles(), loadPredictions()]);
    } catch (err) {
      console.error('Failed to save daily log:', err);
      setError(err instanceof Error ? err.message : 'Failed to save log');
      throw err;
    }
  }, [userId]);
  
  const deleteLog = useCallback(async (date: string) => {
    setError(null);
    
    try {
      const api = await getCycleApi();
      await api.deleteDailyLog(date, userId);
      
      // Remove from local state
      setDailyLogs(prev => prev.filter(l => l.date !== date));
      
      // Reload cycles and predictions
      await Promise.all([loadCycles(), loadPredictions()]);
    } catch (err) {
      console.error('Failed to delete daily log:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete log');
      throw err;
    }
  }, [userId]);
  
  // ==================== CYCLES ====================
  
  const loadCycles = useCallback(async () => {
    setIsLoadingCycles(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const data = await api.getCycles(userId);
      setCycles(data);
    } catch (err) {
      console.error('Failed to load cycles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cycles');
    } finally {
      setIsLoadingCycles(false);
    }
  }, [userId]);
  
  // ==================== PREDICTIONS ====================
  
  const loadPredictions = useCallback(async () => {
    setIsLoadingPredictions(true);
    setError(null);
    
    try {
      const api = await getCycleApi();
      const data = await api.getPredictions(userId);
      setPredictions(data);
    } catch (err) {
      console.error('Failed to load predictions:', err);
      // Don't set error for predictions - they might not exist yet
      setPredictions(null);
    } finally {
      setIsLoadingPredictions(false);
    }
  }, [userId]);
  
  // ==================== RELOAD ALL ====================
  
  const reload = useCallback(async () => {
    // First, load settings to check if user has completed onboarding
    const loadedSettings = await loadSettings();
    
    // Only load cycles and predictions if settings exist
    // This avoids 404 errors before onboarding is complete
    if (loadedSettings) {
      await Promise.all([
        loadCycles(),
        loadPredictions(),
      ]);
    }
  }, [loadSettings, loadCycles, loadPredictions]);
  
  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      reload();
    }
  }, [autoLoad, reload]);
  
  return {
    // Data
    settings,
    dailyLogs,
    cycles,
    predictions,
    
    // Loading states
    isLoading,
    isLoadingSettings,
    isLoadingLogs,
    isLoadingCycles,
    isLoadingPredictions,
    
    // Errors
    error,
    
    // Actions
    loadSettings,
    createSettings,
    updateSettings,
    
    loadDailyLogs,
    createOrUpdateLog,
    deleteLog,
    
    loadCycles,
    loadPredictions,
    
    reload,
  };
}

