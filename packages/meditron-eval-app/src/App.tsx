import { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { EvalControls } from './components/EvalControls';
import { ItemCard } from './components/ItemCard';
import { ResultDetail } from './components/ResultDetail';
import { useApi } from './hooks/useApi';
import type { ItemResult, EvalItem } from './types';

function App() {
  const api = useApi();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<ItemResult | null>(null);
  const [selectedItemDetail, setSelectedItemDetail] = useState<EvalItem | null>(null);
  const [filter, setFilter] = useState<{
    domain: string | null;
    difficulty: string | null;
    status: string | null;
  }>({ domain: null, difficulty: null, status: null });

  // Initial data load
  useEffect(() => {
    api.fetchHealth();
    api.fetchDataset();
    api.fetchProgress();
    api.fetchResults();
  }, []);

  // Polling when evaluation is running
  useEffect(() => {
    if (api.progress?.status === 'running') {
      api.startPolling();
    } else {
      api.stopPolling();
    }
  }, [api.progress?.status]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      api.fetchHealth(),
      api.fetchDataset(),
      api.fetchProgress(),
      api.fetchResults(),
    ]);
  }, [api]);

  const handleStartEval = useCallback(async () => {
    const ids = selectedItems.size > 0 ? Array.from(selectedItems) : undefined;
    await api.startEvaluation(ids);
    api.startPolling();
  }, [api, selectedItems]);

  const handleStopEval = useCallback(async () => {
    await api.stopEvaluation();
    api.stopPolling();
    await api.fetchProgress();
    await api.fetchResults();
  }, [api]);

  const handleReset = useCallback(async () => {
    await api.resetEvaluation();
    setSelectedItems(new Set());
  }, [api]);

  const handleSelectItem = useCallback((id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (api.dataset?.items) {
      setSelectedItems(new Set(api.dataset.items.map((i) => i.id)));
    }
  }, [api.dataset]);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const handleViewResult = useCallback(async (result: ItemResult) => {
    setSelectedResult(result);
    const item = await api.fetchItem(result.item_id);
    setSelectedItemDetail(item);
  }, [api]);

  // Get result for an item
  const getItemResult = useCallback((id: string): ItemResult | undefined => {
    return api.results?.results?.find((r) => r.item_id === id);
  }, [api.results]);

  // Filter items
  const filteredItems = api.dataset?.items.filter((item) => {
    if (filter.domain && item.domain !== filter.domain) return false;
    if (filter.difficulty && item.difficulty !== filter.difficulty) return false;
    if (filter.status) {
      const result = getItemResult(item.id);
      if (filter.status === 'evaluated' && !result) return false;
      if (filter.status === 'pending' && result) return false;
    }
    return true;
  }) || [];

  // Get unique domains
  const domains = [...new Set(api.dataset?.items.map((i) => i.domain) || [])];

  const isConnected = api.health?.llm_connected ?? false;
  const isRunning = api.progress?.status === 'running';
  const hasResults = (api.results?.results?.length || 0) > 0;

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Header health={api.health} onRefresh={handleRefresh} />

        {/* Dashboard */}
        <Dashboard summary={api.results} progress={api.progress} />

        {/* Controls */}
        <div className="mt-8">
          <EvalControls
            isRunning={isRunning}
            hasResults={hasResults}
            isConnected={isConnected}
            selectedCount={selectedItems.size}
            onStart={handleStartEval}
            onStop={handleStopEval}
            onReset={handleReset}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
          />
        </div>

        {/* Main content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters sidebar */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-4 sticky top-6">
              <h3 className="font-display text-sm text-white/40 uppercase tracking-wider mb-4">
                Filters
              </h3>

              {/* Domain filter */}
              <div className="mb-4">
                <label className="block text-xs text-white/50 mb-2">Domain</label>
                <select
                  value={filter.domain || ''}
                  onChange={(e) => setFilter((f) => ({ ...f, domain: e.target.value || null }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="">All domains</option>
                  {domains.map((d) => (
                    <option key={d} value={d}>
                      {d.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty filter */}
              <div className="mb-4">
                <label className="block text-xs text-white/50 mb-2">Difficulty</label>
                <select
                  value={filter.difficulty || ''}
                  onChange={(e) => setFilter((f) => ({ ...f, difficulty: e.target.value || null }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="">All difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="mb-4">
                <label className="block text-xs text-white/50 mb-2">Status</label>
                <select
                  value={filter.status || ''}
                  onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value || null }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                >
                  <option value="">All items</option>
                  <option value="evaluated">Evaluated</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Showing</span>
                  <span className="text-white/80 font-mono">
                    {filteredItems.length}/{api.dataset?.items_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Items grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item, idx) => {
                const result = getItemResult(item.id);
                return (
                  <div
                    key={item.id}
                    className="stagger-in"
                    style={{ animationDelay: `${Math.min(idx * 50, 500)}ms` }}
                  >
                    <ItemCard
                      item={item}
                      result={result}
                      isSelected={selectedItems.has(item.id)}
                      onSelect={(id) => {
                        if (result) {
                          handleViewResult(result);
                        } else {
                          handleSelectItem(id);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-white/40 font-body">No items match your filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Result detail modal */}
        {selectedResult && (
          <ResultDetail
            result={selectedResult}
            item={selectedItemDetail}
            onClose={() => {
              setSelectedResult(null);
              setSelectedItemDetail(null);
            }}
          />
        )}

        {/* Error toast */}
        {api.error && (
          <div className="fixed bottom-6 right-6 glass-strong rounded-xl p-4 border border-rose-500/20 max-w-md animate-in slide-in-from-bottom">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-body font-medium text-rose-400">Error</h4>
                <p className="text-sm text-white/60 mt-1">{api.error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

