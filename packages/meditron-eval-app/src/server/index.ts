import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { MeditronClient, DEFAULT_CONFIG } from './llm.js';
import { scoreItem, calculateSummary } from './scorer.js';
import type { EvalDataset, EvalItem, ItemResult, EvalProgress, EvalSummary } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// State
let dataset: EvalDataset | null = null;
let llmClient: MeditronClient;
let evalProgress: EvalProgress = {
  total: 0,
  completed: 0,
  current_item_id: null,
  status: 'idle',
};
let currentResults: ItemResult[] = [];
let lastSummary: EvalSummary | null = null;

// Initialize LLM client
llmClient = new MeditronClient();

// Load dataset
function loadDataset(): boolean {
  const datasetPaths = [
    // Look in app root first (self-contained)
    resolve(__dirname, '../..', 'evaluation-dataset.json'),
    resolve(process.cwd(), 'evaluation-dataset.json'),
    // Fallback to parent directories
    resolve(__dirname, '../../..', 'evaluation-dataset.json'),
    resolve(__dirname, '../../../..', 'evaluation-dataset.json'),
  ];

  for (const datasetPath of datasetPaths) {
    if (existsSync(datasetPath)) {
      try {
        const raw = readFileSync(datasetPath, 'utf-8');
        dataset = JSON.parse(raw) as EvalDataset;
        console.log(`✓ Loaded dataset: ${dataset.dataset_name} (${dataset.items.length} items)`);
        return true;
      } catch (error) {
        console.error(`Failed to parse dataset at ${datasetPath}:`, error);
      }
    }
  }

  console.error('Dataset not found in any expected location');
  return false;
}

// API Routes

// Health check
app.get('/api/health', async (_req, res) => {
  const llmHealth = await llmClient.healthCheck();
  
  res.json({
    status: llmHealth.ok && dataset ? 'ok' : 'error',
    llm_connected: llmHealth.ok,
    llm_error: llmHealth.error,
    dataset_loaded: !!dataset,
    items_count: dataset?.items.length || 0,
    model: llmClient.getConfig().model,
  });
});

// Get dataset info
app.get('/api/dataset', (_req, res) => {
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not loaded' });
  }

  res.json({
    name: dataset.dataset_name,
    version: dataset.version,
    locale_focus: dataset.locale_focus,
    notes: dataset.notes,
    dimensions: dataset.global_scoring.dimensions,
    items_count: dataset.items.length,
    items: dataset.items.map((item) => ({
      id: item.id,
      title: item.title,
      domain: item.domain,
      difficulty: item.difficulty,
    })),
  });
});

// Get single item
app.get('/api/items/:id', (req, res) => {
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not loaded' });
  }

  const item = dataset.items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
});

// Get eval progress
app.get('/api/eval/progress', (_req, res) => {
  res.json(evalProgress);
});

// Get eval results
app.get('/api/eval/results', (_req, res) => {
  if (lastSummary) {
    return res.json(lastSummary);
  }
  
  if (currentResults.length > 0) {
    return res.json({
      results: currentResults,
      completed: evalProgress.completed,
      total: evalProgress.total,
    });
  }

  res.json({ results: [], completed: 0, total: 0 });
});

// Run single item evaluation
app.post('/api/eval/single/:id', async (req, res) => {
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not loaded' });
  }

  const item = dataset.items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  try {
    console.log(`Evaluating item: ${item.id} - ${item.title}`);
    const response = await llmClient.complete(item.question);
    const result = scoreItem(item, response);
    res.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start full evaluation
app.post('/api/eval/start', async (req, res) => {
  if (!dataset) {
    return res.status(404).json({ error: 'Dataset not loaded' });
  }

  if (evalProgress.status === 'running') {
    return res.status(400).json({ error: 'Evaluation already running' });
  }

  const { itemIds } = req.body as { itemIds?: string[] };
  const itemsToEval = itemIds
    ? dataset.items.filter((i) => itemIds.includes(i.id))
    : dataset.items;

  if (itemsToEval.length === 0) {
    return res.status(400).json({ error: 'No items to evaluate' });
  }

  // Reset state
  currentResults = [];
  lastSummary = null;
  evalProgress = {
    total: itemsToEval.length,
    completed: 0,
    current_item_id: null,
    status: 'running',
  };

  // Run evaluation in background
  runEvaluation(itemsToEval).catch((error) => {
    console.error('Evaluation failed:', error);
    evalProgress.status = 'error';
    evalProgress.error = error instanceof Error ? error.message : 'Unknown error';
  });

  res.json({
    message: 'Evaluation started',
    total: itemsToEval.length,
  });
});

// Stop evaluation
app.post('/api/eval/stop', (_req, res) => {
  if (evalProgress.status === 'running') {
    evalProgress.status = 'idle';
    res.json({ message: 'Evaluation stopped' });
  } else {
    res.json({ message: 'No evaluation running' });
  }
});

// Reset evaluation
app.post('/api/eval/reset', (_req, res) => {
  currentResults = [];
  lastSummary = null;
  evalProgress = {
    total: 0,
    completed: 0,
    current_item_id: null,
    status: 'idle',
  };
  res.json({ message: 'Evaluation reset' });
});

// Background evaluation runner
async function runEvaluation(items: EvalItem[]) {
  if (!dataset) return;

  for (const item of items) {
    if (evalProgress.status !== 'running') {
      console.log('Evaluation stopped by user');
      break;
    }

    evalProgress.current_item_id = item.id;
    console.log(`[${evalProgress.completed + 1}/${evalProgress.total}] Evaluating: ${item.id} - ${item.title}`);

    try {
      const response = await llmClient.complete(item.question);
      const result = scoreItem(item, response);
      currentResults.push(result);
      
      console.log(`  → Score: ${result.final_score_0_100} (${result.band})`);
    } catch (error) {
      console.error(`  → Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      // Create error result
      currentResults.push({
        item_id: item.id,
        final_score_0_100: 0,
        band: 'Unsafe/Fail',
        unsafe_flag: false,
        dimension_scores: {
          clinical_accuracy: 0,
          reasoning_quality: 0,
          safety_and_escalation: 0,
          uncertainty_handling: 0,
          africa_context_fit: 0,
        },
        missed_key_points: item.key_points,
        notes: [`Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        response: '',
      });
    }

    evalProgress.completed++;
  }

  // Calculate final summary
  if (evalProgress.status === 'running') {
    lastSummary = calculateSummary(currentResults, dataset.dataset_name, dataset.version);
    evalProgress.status = 'completed';
    evalProgress.current_item_id = null;
    
    console.log('\n=== Evaluation Complete ===');
    console.log(`Average Score: ${lastSummary.avg_score}`);
    console.log(`Unsafe Count: ${lastSummary.unsafe_count}`);
    console.log('Band Distribution:', lastSummary.band_counts);
  }
}

// Start server
loadDataset();

app.listen(PORT, () => {
  console.log(`\n🚀 Meditron Eval Server running at http://localhost:${PORT}`);
  console.log(`📊 LLM endpoint: ${DEFAULT_CONFIG.baseUrl}`);
  console.log(`🤖 Model: ${DEFAULT_CONFIG.model}\n`);
});

