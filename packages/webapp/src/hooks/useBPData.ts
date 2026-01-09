/**
 * useBPData Hook
 * 
 * Main hook for managing blood pressure data state and API interactions
 */

import { useState, useEffect, useCallback } from 'react';
import { useActiveProfile } from '../contexts';
import * as bpApi from '../services/bpApi';
import type {
  BPSettings,
  CreateSettingsRequest,
  BPSession,
  CreateSessionRequest,
  BPSuggestion,
  BPPatternAnalysis,
} from '../types/bp';

export function useBPData() {
  const { activeProfile } = useActiveProfile();
  const userId = activeProfile?.id;

  const [settings, setSettings] = useState<BPSettings | null>(null);
  const [sessions, setSessions] = useState<BPSession[]>([]);
  const [suggestions, setSuggestions] = useState<BPSuggestion[]>([]);
  const [analytics, setAnalytics] = useState<BPPatternAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings
  const loadSettings = useCallback(async () => {
    if (!userId) return;

    try {
      const data = await bpApi.getSettings(userId);
      setSettings(data);
    } catch (err: any) {
      console.error('Error loading BP settings:', err);
      setSettings(null);
    }
  }, [userId]);

  // Load sessions
  const loadSessions = useCallback(async (days: number = 30) => {
    if (!userId) return;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const data = await bpApi.getSessions({
        userId,
        startDate,
        limit: 100,
      });
      setSessions(data);
    } catch (err: any) {
      console.error('Error loading BP sessions:', err);
      setError('Failed to load sessions');
    }
  }, [userId]);

  // Load suggestions
  const loadSuggestions = useCallback(async () => {
    if (!userId || !settings) return;

    try {
      const data = await bpApi.getSuggestions(userId);
      setSuggestions(data);
    } catch (err: any) {
      console.error('Error loading BP suggestions:', err);
    }
  }, [userId, settings]);

  // Load analytics
  const loadAnalytics = useCallback(async (days: number = 7) => {
    if (!userId || !settings) return;

    try {
      const data = await bpApi.getAnalytics(days, userId);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading BP analytics:', err);
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
      loadSessions();
      loadSuggestions();
      loadAnalytics();
    }
  }, [settings, loadSessions, loadSuggestions, loadAnalytics]);

  // Create settings (onboarding)
  const createSettings = useCallback(
    async (data: CreateSettingsRequest) => {
      if (!userId) throw new Error('No user ID');

      try {
        const newSettings = await bpApi.createSettings(data, userId);
        setSettings(newSettings);
        return newSettings;
      } catch (err: any) {
        setError(err.message || 'Failed to create settings');
        throw err;
      }
    },
    [userId]
  );

  // Update settings
  const updateSettings = useCallback(
    async (updates: Partial<BPSettings>) => {
      if (!userId) throw new Error('No user ID');

      try {
        const updated = await bpApi.updateSettings(updates, userId);
        setSettings(updated);
        return updated;
      } catch (err: any) {
        setError(err.message || 'Failed to update settings');
        throw err;
      }
    },
    [userId]
  );

  // Create session
  const createSession = useCallback(
    async (data: CreateSessionRequest) => {
      if (!userId) throw new Error('No user ID');

      try {
        const newSession = await bpApi.createSession(data, userId);
        setSessions((prev) => [newSession, ...prev]);

        // Reload suggestions and analytics
        loadSuggestions();
        loadAnalytics();

        return newSession;
      } catch (err: any) {
        setError(err.message || 'Failed to create session');
        throw err;
      }
    },
    [userId, loadSuggestions, loadAnalytics]
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!userId) throw new Error('No user ID');

      try {
        await bpApi.deleteSession(sessionId, userId);
        setSessions((prev) => prev.filter((s) => s._id !== sessionId));

        // Reload suggestions and analytics
        loadSuggestions();
        loadAnalytics();
      } catch (err: any) {
        setError(err.message || 'Failed to delete session');
        throw err;
      }
    },
    [userId, loadSuggestions, loadAnalytics]
  );

  return {
    settings,
    sessions,
    suggestions,
    analytics,
    isLoading,
    error,
    hasOnboarded: settings !== null,
    createSettings,
    updateSettings,
    createSession,
    deleteSession,
    refreshData: () => {
      loadSettings();
      loadSessions();
      loadSuggestions();
      loadAnalytics();
    },
  };
}

