/**
 * useGlucoseData Hook
 * 
 * Main hook for managing glucose data state and API interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useActiveProfile } from '../contexts';
import * as glucoseApi from '../services/glucoseApi';
import type {
  GlucoseSettings,
  CreateSettingsRequest,
  GlucoseReading,
  CreateReadingRequest,
  Suggestion,
  PatternAnalysis,
} from '../types/glucose';

export function useGlucoseData() {
  const { activeProfile } = useActiveProfile();
  const userId = activeProfile?.id;

  const [settings, setSettings] = useState<GlucoseSettings | null>(null);
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analytics, setAnalytics] = useState<PatternAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;
    
    try {
      const data = await glucoseApi.getSettings(userId);
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading settings:', err);
      setSettings(null);
    }
  }, [userId]);

  // Load readings
  const loadReadings = useCallback(async (days: number = 30) => {
    if (!userId) return;
    
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const data = await glucoseApi.getReadings({
        userId,
        startDate,
        limit: 100,
      });
      setReadings(data);
    } catch (err: any) {
      console.error('Error loading readings:', err);
      setError('Failed to load readings');
    }
  }, [userId]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!userId || !settings) return;
    
    try {
      const data = await glucoseApi.getSuggestions(userId);
      setSuggestions(data);
    } catch (err: any) {
      console.error('Error loading suggestions:', err);
    }
  }, [userId, settings]);

  // Load analytics
  const loadAnalytics = useCallback(async (days: number = 7) => {
    if (!userId || !settings) return;
    
    try {
      const data = await glucoseApi.getAnalytics(days, userId);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
    }
  }, [userId, settings]);

  // Initial load
  useEffect(() => {
    async function initialize() {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await loadSettings();
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    initialize();
  }, [userId, loadSettings]);

  // Load data when settings are available
  useEffect(() => {
    if (settings) {
      loadReadings();
      loadSuggestions();
      loadAnalytics();
    }
  }, [settings, loadReadings, loadSuggestions, loadAnalytics]);

  // Create settings (onboarding)
  const createSettings = useCallback(async (data: CreateSettingsRequest) => {
    if (!userId) throw new Error('No user ID');
    
    try {
      const newSettings = await glucoseApi.createSettings(data, userId);
      setSettings(newSettings);
      return newSettings;
    } catch (err: any) {
      setError(err.message || 'Failed to create settings');
      throw err;
    }
  }, [userId]);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<GlucoseSettings>) => {
    if (!userId) throw new Error('No user ID');
    
    try {
      const updated = await glucoseApi.updateSettings(updates, userId);
      setSettings(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      throw err;
    }
  }, [userId]);

  // Create reading
  const createReading = useCallback(async (data: CreateReadingRequest) => {
    if (!userId) throw new Error('No user ID');
    
    try {
      const newReading = await glucoseApi.createReading(data, userId);
      setReadings((prev) => [newReading, ...prev]);
      
      // Reload suggestions and analytics
      loadSuggestions();
      loadAnalytics();
      
      return newReading;
    } catch (err: any) {
      setError(err.message || 'Failed to create reading');
      throw err;
    }
  }, [userId, loadSuggestions, loadAnalytics]);

  // Delete reading
  const deleteReading = useCallback(async (readingId: string) => {
    if (!userId) throw new Error('No user ID');
    
    try {
      await glucoseApi.deleteReading(readingId, userId);
      setReadings((prev) => prev.filter((r) => r._id !== readingId));
      
      // Reload suggestions and analytics
      loadSuggestions();
      loadAnalytics();
    } catch (err: any) {
      setError(err.message || 'Failed to delete reading');
      throw err;
    }
  }, [userId, loadSuggestions, loadAnalytics]);

  return {
    settings,
    readings,
    suggestions,
    analytics,
    isLoading,
    error,
    hasOnboarded: settings !== null,
    createSettings,
    updateSettings,
    createReading,
    deleteReading,
    refreshData: () => {
      loadSettings();
      loadReadings();
      loadSuggestions();
      loadAnalytics();
    },
  };
}

