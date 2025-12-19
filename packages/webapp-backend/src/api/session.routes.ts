import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import { orchestrator } from '../core/orchestrator.js';
import { Session } from '../models/session.model.js';
import { config } from '../config/index.js';

const router: RouterType = Router();

// POST /api/session/start - Start a new session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const response = await orchestrator.startSession(userId);

    if (config.debugMode) {
      console.log(`[API] Session started: ${response.sessionId}`);
    }

    res.json(response);
  } catch (error) {
    console.error('[API] Error starting session:', error);
    res.status(500).json({ 
      error: 'Failed to start session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/session/:id/input - Send input to session
router.post('/:id/input', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { input } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (input === undefined) {
      return res.status(400).json({ error: 'input is required' });
    }

    const response = await orchestrator.handleInput(id, input);

    if (config.debugMode) {
      console.log(`[API] Session ${id} input processed -> ${response.currentState}`);
    }

    res.json(response);
  } catch (error) {
    console.error('[API] Error processing input:', error);
    res.status(500).json({ 
      error: 'Failed to process input',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/session/:id - Get session details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const response = await orchestrator.getSession(id);

    if (!response) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(response);
  } catch (error) {
    console.error('[API] Error getting session:', error);
    res.status(500).json({ 
      error: 'Failed to get session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/session/user/:userId - Get user's sessions
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const sessions = await Session.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('_id currentState status startedAt completedAt summary');

    res.json(sessions);
  } catch (error) {
    console.error('[API] Error getting user sessions:', error);
    res.status(500).json({ 
      error: 'Failed to get user sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/session/:id - Abandon session
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await Session.findByIdAndUpdate(id, { status: 'abandoned' });
    
    res.json({ success: true, message: 'Session abandoned' });
  } catch (error) {
    console.error('[API] Error abandoning session:', error);
    res.status(500).json({ 
      error: 'Failed to abandon session',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
