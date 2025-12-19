import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { HealthRecord } from '../models/health-record.model.js';
import { llmManager } from '../services/llm/manager.js';
import { stateLoader } from '../core/state-loader.js';

const router: RouterType = Router();

// GET /api/health - Health check endpoint
router.get('/', async (_req: Request, res: Response) => {
  try {
    const machine = stateLoader.load();
    const providers = llmManager.getAllProviders();
    const activeProvider = llmManager.getActiveProviderName();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      stateMachine: {
        name: machine.metadata.name,
        version: machine.metadata.version,
        nodeCount: Object.keys(machine.nodes).length,
      },
      llm: {
        activeProvider,
        providers: providers.map(p => ({
          name: p.name,
          isAvailable: p.isAvailable,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/health/record/:userId - Get user's health record
router.get('/record/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    let record = await HealthRecord.findOne({ userId });
    
    if (!record) {
      // Create empty record
      record = new HealthRecord({
        userId,
        vitals: [],
        events: [],
        screenings: [],
        notes: [],
      });
      await record.save();
    }

    res.json(record);
  } catch (error) {
    console.error('[API] Error getting health record:', error);
    res.status(500).json({ 
      error: 'Failed to get health record',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/health/record/:userId/vital - Add vital reading
router.post('/record/:userId/vital', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, value, unit, source } = req.body;

    const record = await HealthRecord.findOneAndUpdate(
      { userId },
      {
        $push: {
          vitals: {
            type,
            value,
            unit,
            source: source || 'self_reported',
            recordedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json(record);
  } catch (error) {
    console.error('[API] Error adding vital:', error);
    res.status(500).json({ 
      error: 'Failed to add vital',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/health/record/:userId/event - Add health event
router.post('/record/:userId/event', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { type, description, severity, sessionId } = req.body;

    const record = await HealthRecord.findOneAndUpdate(
      { userId },
      {
        $push: {
          events: {
            type,
            description,
            severity,
            sessionId,
            recordedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json(record);
  } catch (error) {
    console.error('[API] Error adding event:', error);
    res.status(500).json({ 
      error: 'Failed to add event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/health/llm - Get LLM status
router.get('/llm', async (_req: Request, res: Response) => {
  try {
    const providers = llmManager.getAllProviders();
    const activeProvider = llmManager.getActiveProviderName();

    res.json({
      activeProvider,
      providers,
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get LLM status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/health/llm/provider - Set active LLM provider
router.post('/llm/provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.body;
    
    const success = llmManager.setActiveProvider(provider);
    
    if (!success) {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({
      activeProvider: llmManager.getActiveProviderName(),
      providers: llmManager.getAllProviders(),
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to set provider',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
