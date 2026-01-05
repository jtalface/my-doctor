import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  EvalProgress, 
  EvalSummary, 
  ItemResult, 
  EvalItem,
  HealthCheckResponse 
} from '../types';

const API_BASE = '/api';

interface DatasetInfo {
  name: string;
  version: string;
  locale_focus: string;
  notes: string[];
  dimensions: { name: string; weight: number; description: string }[];
  items_count: number;
  items: { id: string; title: string; domain: string; difficulty: string }[];
}

export function useApi() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [dataset, setDataset] = useState<DatasetInfo | null>(null);
  const [progress, setProgress] = useState<EvalProgress | null>(null);
  const [results, setResults] = useState<EvalSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      setHealth(data);
      return data;
    } catch (err) {
      setError('Failed to connect to server');
      return null;
    }
  }, []);

  const fetchDataset = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/dataset`);
      if (!res.ok) throw new Error('Failed to fetch dataset');
      const data = await res.json();
      setDataset(data);
      return data;
    } catch (err) {
      setError('Failed to load dataset');
      return null;
    }
  }, []);

  const fetchItem = useCallback(async (id: string): Promise<EvalItem | null> => {
    try {
      const res = await fetch(`${API_BASE}/items/${id}`);
      if (!res.ok) throw new Error('Failed to fetch item');
      return await res.json();
    } catch (err) {
      return null;
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/eval/progress`);
      const data = await res.json();
      setProgress(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/eval/results`);
      const data = await res.json();
      setResults(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const startEvaluation = useCallback(async (itemIds?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/eval/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start evaluation');
      }
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const stopEvaluation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/eval/stop`, { method: 'POST' });
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const resetEvaluation = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/eval/reset`, { method: 'POST' });
      setProgress(null);
      setResults(null);
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const evaluateSingle = useCallback(async (id: string): Promise<ItemResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/eval/single/${id}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to evaluate item');
      }
      return await res.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling for progress during evaluation
  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    
    const poll = async () => {
      const prog = await fetchProgress();
      if (prog?.status === 'running') {
        await fetchResults();
        pollRef.current = window.setTimeout(poll, 1000);
      } else if (prog?.status === 'completed') {
        await fetchResults();
        pollRef.current = null;
      }
    };
    
    poll();
  }, [fetchProgress, fetchResults]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return {
    health,
    dataset,
    progress,
    results,
    loading,
    error,
    fetchHealth,
    fetchDataset,
    fetchItem,
    fetchProgress,
    fetchResults,
    startEvaluation,
    stopEvaluation,
    resetEvaluation,
    evaluateSingle,
    startPolling,
    stopPolling,
  };
}

