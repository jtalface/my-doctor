/**
 * useCycleData Hook Tests
 * 
 * Tests the central cycle data management hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCycleData } from '../useCycleData';
import type { CycleSettings, DailyLog, Cycle, Prediction } from '../../types/cycle';

// Mock the cycleApi module
vi.mock('../../services/cycleApi', () => ({
  getSettings: vi.fn(),
  createSettings: vi.fn(),
  updateSettings: vi.fn(),
  getDailyLogs: vi.fn(),
  createOrUpdateDailyLog: vi.fn(),
  deleteDailyLog: vi.fn(),
  getCycles: vi.fn(),
  getPredictions: vi.fn(),
}));

describe('useCycleData Hook', () => {
  let mockCycleApi: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import the mocked module
    mockCycleApi = await import('../../services/cycleApi');
  });

  const mockSettings: CycleSettings = {
    userId: 'user-1',
    averageCycleLength: 28,
    averagePeriodLength: 5,
    trackingStartDate: '2024-01-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDailyLog: DailyLog = {
    userId: 'user-1',
    date: '2024-01-15',
    flow: 'medium',
    symptoms: ['cramps'],
    mood: ['happy'],
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockCycle: Cycle = {
    userId: 'user-1',
    startDate: '2024-01-01',
    endDate: '2024-01-05',
    cycleLength: 28,
    periodLength: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPrediction: Prediction = {
    type: 'regular',
    nextPeriod: {
      start: '2024-02-15',
      end: '2024-02-20',
    },
    fertileWindow: {
      start: '2024-02-05',
      end: '2024-02-10',
    },
    ovulation: {
      date: '2024-02-08',
    },
    confidence: 'high',
    basedOnCycles: 6,
  };

  describe('Initialization', () => {
    it('initializes with empty state', () => {
      mockCycleApi.getSettings.mockResolvedValue(null);
      mockCycleApi.getCycles.mockResolvedValue([]);
      mockCycleApi.getPredictions.mockResolvedValue(null);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      expect(result.current.settings).toBeNull();
      expect(result.current.dailyLogs).toEqual([]);
      expect(result.current.cycles).toEqual([]);
      expect(result.current.predictions).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('auto-loads data on mount by default', async () => {
      mockCycleApi.getSettings.mockResolvedValue(mockSettings);
      mockCycleApi.getCycles.mockResolvedValue([mockCycle]);
      mockCycleApi.getPredictions.mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useCycleData());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockCycleApi.getSettings).toHaveBeenCalled();
      expect(mockCycleApi.getCycles).toHaveBeenCalled();
      expect(mockCycleApi.getPredictions).toHaveBeenCalled();
    });

    it('does not auto-load when autoLoad is false', () => {
      mockCycleApi.getSettings.mockResolvedValue(mockSettings);

      renderHook(() => useCycleData({ autoLoad: false }));

      expect(mockCycleApi.getSettings).not.toHaveBeenCalled();
    });

    it('passes userId to API calls', async () => {
      mockCycleApi.getSettings.mockResolvedValue(mockSettings);
      mockCycleApi.getCycles.mockResolvedValue([]);
      mockCycleApi.getPredictions.mockResolvedValue(null);

      renderHook(() => useCycleData({ userId: 'dependent-123' }));

      await waitFor(() => {
        expect(mockCycleApi.getSettings).toHaveBeenCalledWith('dependent-123');
      });
    });
  });

  describe('Settings Management', () => {
    it('loads settings successfully', async () => {
      mockCycleApi.getSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadSettings();

      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.error).toBeNull();
    });

    it('handles settings load error', async () => {
      mockCycleApi.getSettings.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadSettings();

      expect(result.current.settings).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('creates settings successfully', async () => {
      mockCycleApi.createSettings.mockResolvedValue(mockSettings);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.createSettings({
        averageCycleLength: 28,
        averagePeriodLength: 5,
        trackingStartDate: '2024-01-01',
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.error).toBeNull();
    });

    it('updates settings and reloads predictions', async () => {
      mockCycleApi.updateSettings.mockResolvedValue(mockSettings);
      mockCycleApi.getPredictions.mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.updateSettings({
        averageCycleLength: 30,
      });

      expect(result.current.settings).toEqual(mockSettings);
      expect(mockCycleApi.getPredictions).toHaveBeenCalled();
    });
  });

  describe('Daily Logs Management', () => {
    it('loads daily logs for date range', async () => {
      mockCycleApi.getDailyLogs.mockResolvedValue([mockDailyLog]);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadDailyLogs('2024-01-01', '2024-01-31');

      expect(result.current.dailyLogs).toEqual([mockDailyLog]);
      expect(mockCycleApi.getDailyLogs).toHaveBeenCalledWith('2024-01-01', '2024-01-31', undefined);
    });

    it('creates or updates daily log', async () => {
      mockCycleApi.createOrUpdateDailyLog.mockResolvedValue(mockDailyLog);
      mockCycleApi.getCycles.mockResolvedValue([mockCycle]);
      mockCycleApi.getPredictions.mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.createOrUpdateLog({
        date: '2024-01-15',
        flow: 'medium',
        symptoms: ['cramps'],
        mood: ['happy'],
        notes: '',
      });

      expect(result.current.dailyLogs).toContainEqual(mockDailyLog);
      // Should reload cycles and predictions
      expect(mockCycleApi.getCycles).toHaveBeenCalled();
      expect(mockCycleApi.getPredictions).toHaveBeenCalled();
    });

    it('updates existing log in state', async () => {
      const updatedLog = { ...mockDailyLog, flow: 'heavy' as const };
      mockCycleApi.createOrUpdateDailyLog.mockResolvedValue(updatedLog);
      mockCycleApi.getCycles.mockResolvedValue([]);
      mockCycleApi.getPredictions.mockResolvedValue(null);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      // Set initial log
      await result.current.createOrUpdateLog({
        date: '2024-01-15',
        flow: 'medium',
        symptoms: [],
        mood: [],
        notes: '',
      });

      // Update the same log
      mockCycleApi.createOrUpdateDailyLog.mockResolvedValue(updatedLog);
      await result.current.createOrUpdateLog({
        date: '2024-01-15',
        flow: 'heavy',
        symptoms: [],
        mood: [],
        notes: '',
      });

      expect(result.current.dailyLogs).toHaveLength(1);
      expect(result.current.dailyLogs[0].flow).toBe('heavy');
    });

    it('deletes daily log', async () => {
      mockCycleApi.deleteDailyLog.mockResolvedValue({ success: true });
      mockCycleApi.getCycles.mockResolvedValue([]);
      mockCycleApi.getPredictions.mockResolvedValue(null);
      mockCycleApi.getDailyLogs.mockResolvedValue([mockDailyLog]);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      // Load logs first
      await result.current.loadDailyLogs('2024-01-01', '2024-01-31');
      expect(result.current.dailyLogs).toHaveLength(1);

      // Delete log
      await result.current.deleteLog('2024-01-15');

      expect(result.current.dailyLogs).toHaveLength(0);
      expect(mockCycleApi.deleteDailyLog).toHaveBeenCalledWith('2024-01-15', undefined);
    });
  });

  describe('Cycles Management', () => {
    it('loads cycles successfully', async () => {
      mockCycleApi.getCycles.mockResolvedValue([mockCycle]);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadCycles();

      expect(result.current.cycles).toEqual([mockCycle]);
    });

    it('handles cycles load error', async () => {
      mockCycleApi.getCycles.mockRejectedValue(new Error('Failed to load'));

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadCycles();

      expect(result.current.cycles).toEqual([]);
      expect(result.current.error).toBe('Failed to load');
    });
  });

  describe('Predictions Management', () => {
    it('loads predictions successfully', async () => {
      mockCycleApi.getPredictions.mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadPredictions();

      expect(result.current.predictions).toEqual(mockPrediction);
    });

    it('handles predictions not available', async () => {
      mockCycleApi.getPredictions.mockRejectedValue(new Error('Not enough data'));

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.loadPredictions();

      // Should not set error for predictions (they might not exist yet)
      expect(result.current.predictions).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('sets loading state during settings load', async () => {
      let resolveSettings: any;
      mockCycleApi.getSettings.mockReturnValue(
        new Promise(resolve => { resolveSettings = resolve; })
      );

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      const loadPromise = result.current.loadSettings();
      
      // Should be loading
      expect(result.current.isLoadingSettings).toBe(true);
      expect(result.current.isLoading).toBe(true);

      resolveSettings(mockSettings);
      await loadPromise;

      // Should no longer be loading
      await waitFor(() => {
        expect(result.current.isLoadingSettings).toBe(false);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('combines multiple loading states', async () => {
      let resolveSettings: any;
      let resolveCycles: any;

      mockCycleApi.getSettings.mockReturnValue(
        new Promise(resolve => { resolveSettings = resolve; })
      );
      mockCycleApi.getCycles.mockReturnValue(
        new Promise(resolve => { resolveCycles = resolve; })
      );

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      const settingsPromise = result.current.loadSettings();
      const cyclesPromise = result.current.loadCycles();

      // Both should be loading
      expect(result.current.isLoadingSettings).toBe(true);
      expect(result.current.isLoadingCycles).toBe(true);
      expect(result.current.isLoading).toBe(true);

      resolveSettings(mockSettings);
      await settingsPromise;

      // Settings done, cycles still loading
      await waitFor(() => {
        expect(result.current.isLoadingSettings).toBe(false);
        expect(result.current.isLoadingCycles).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      resolveCycles([mockCycle]);
      await cyclesPromise;

      // Both done
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Reload All', () => {
    it('reloads all data', async () => {
      mockCycleApi.getSettings.mockResolvedValue(mockSettings);
      mockCycleApi.getCycles.mockResolvedValue([mockCycle]);
      mockCycleApi.getPredictions.mockResolvedValue(mockPrediction);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await result.current.reload();

      expect(result.current.settings).toEqual(mockSettings);
      expect(result.current.cycles).toEqual([mockCycle]);
      expect(result.current.predictions).toEqual(mockPrediction);
    });
  });

  describe('Error Handling', () => {
    it('clears error on successful operation', async () => {
      mockCycleApi.getSettings
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockSettings);

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      // First call fails
      await result.current.loadSettings();
      expect(result.current.error).toBe('First error');

      // Second call succeeds
      await result.current.loadSettings();
      expect(result.current.error).toBeNull();
    });

    it('throws error on create/update failures', async () => {
      mockCycleApi.createSettings.mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useCycleData({ autoLoad: false }));

      await expect(result.current.createSettings({
        averageCycleLength: 28,
        averagePeriodLength: 5,
        trackingStartDate: '2024-01-01',
      })).rejects.toThrow('Create failed');
    });
  });
});

