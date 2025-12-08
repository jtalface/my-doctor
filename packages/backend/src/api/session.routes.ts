import { Router, Request, Response } from "express";
import { orchestrator } from "../core/orchestrator";
import { UserRepository, PatientProfileRepository, SessionRepository } from "../models";

const router = Router();
const userRepo = new UserRepository();
const profileRepo = new PatientProfileRepository();
const sessionRepo = new SessionRepository();

/**
 * POST /api/session/start
 * 
 * Creates a new session for a user
 * Body: { email: string, name?: string }
 */
router.post("/start", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: "Email is required",
        code: "MISSING_EMAIL"
      });
    }

    // Find or create user
    const user = await userRepo.findOrCreate(email, name || "User");
    const userId = user._id.toString();

    // Start session through orchestrator
    const result = await orchestrator.startSession(userId);

    return res.status(201).json({
      success: true,
      data: {
        sessionId: result.sessionId,
        userId,
        currentState: result.state,
        prompt: result.prompt,
        inputType: result.node.inputType,
        choices: result.node.choices || []
      }
    });
  } catch (error) {
    console.error("[Session API] Error starting session:", error);
    return res.status(500).json({
      error: "Failed to start session",
      code: "SESSION_START_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * POST /api/session/:id/input
 * 
 * Process user input for a session
 * Body: { input: string }
 */
router.post("/:id/input", async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;
    const { input } = req.body;

    if (!input && input !== "") {
      return res.status(400).json({
        error: "Input is required",
        code: "MISSING_INPUT"
      });
    }

    // Get session to get userId
    const session = await sessionRepo.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    // Check if session has ended
    if (session.endedAt) {
      return res.status(400).json({
        error: "Session has already ended",
        code: "SESSION_ENDED"
      });
    }

    const userId = session.userId.toString();

    // Process input through orchestrator
    const result = await orchestrator.handleInput(input, {
      userId,
      sessionId
    });

    return res.status(200).json({
      success: true,
      data: {
        response: result.response,
        previousState: result.currentState,
        currentState: result.nextState,
        prompt: result.node.prompt,
        inputType: result.node.inputType,
        choices: result.node.choices || [],
        isTerminal: result.isTerminal,
        reasoning: result.reasoning ? {
          redFlags: result.reasoning.redFlags,
          scores: result.reasoning.scores,
          recommendations: result.reasoning.recommendations
        } : undefined
      }
    });
  } catch (error) {
    console.error("[Session API] Error processing input:", error);
    return res.status(500).json({
      error: "Failed to process input",
      code: "INPUT_PROCESS_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/session/:id
 * 
 * Get session details including memory and current state
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const { session, memory, currentNode } = await orchestrator.getSessionState(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        session,
        memory,
        currentNode: currentNode ? {
          id: currentNode.id,
          prompt: currentNode.prompt,
          inputType: currentNode.inputType,
          choices: currentNode.choices || []
        } : null
      }
    });
  } catch (error) {
    console.error("[Session API] Error getting session:", error);
    return res.status(500).json({
      error: "Failed to get session",
      code: "SESSION_GET_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/session/:id/history
 * 
 * Get conversation history for a session
 */
router.get("/:id/history", async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const { memory } = await orchestrator.getSessionState(sessionId);

    if (!memory) {
      return res.status(404).json({
        error: "Session memory not found",
        code: "MEMORY_NOT_FOUND"
      });
    }

    const memoryDoc = memory as { steps?: unknown[]; context?: Record<string, unknown> };

    return res.status(200).json({
      success: true,
      data: {
        steps: memoryDoc.steps || [],
        context: memoryDoc.context || {}
      }
    });
  } catch (error) {
    console.error("[Session API] Error getting history:", error);
    return res.status(500).json({
      error: "Failed to get history",
      code: "HISTORY_GET_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * DELETE /api/session/:id
 * 
 * End a session
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params;

    const session = await sessionRepo.endSession(sessionId);

    if (!session) {
      return res.status(404).json({
        error: "Session not found",
        code: "SESSION_NOT_FOUND"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        sessionId,
        endedAt: session.endedAt
      }
    });
  } catch (error) {
    console.error("[Session API] Error ending session:", error);
    return res.status(500).json({
      error: "Failed to end session",
      code: "SESSION_END_ERROR",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;

