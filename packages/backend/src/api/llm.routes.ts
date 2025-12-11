import { Router, Request, Response } from "express";
import { llmManager, LLMProviderType } from "../services/llm";

const router: Router = Router();

/**
 * GET /api/llm/providers
 * 
 * Get all available LLM providers and their status
 */
router.get("/providers", async (_req: Request, res: Response) => {
  try {
    const status = await llmManager.getStatus();
    return res.status(200).json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /api/llm/provider
 * 
 * Get the current active provider
 */
router.get("/provider", async (_req: Request, res: Response) => {
  try {
    const provider = llmManager.getActiveProvider();
    return res.status(200).json({
      type: provider.type,
      name: provider.name,
      config: provider.getConfig(),
      available: provider.getAvailabilityStatus()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

/**
 * POST /api/llm/provider
 * 
 * Set the active LLM provider
 */
router.post("/provider", async (req: Request, res: Response) => {
  try {
    const { type } = req.body as { type: LLMProviderType };
    
    if (!type) {
      return res.status(400).json({ error: "Provider type is required" });
    }
    
    llmManager.setActiveProvider(type);
    
    const provider = llmManager.getActiveProvider();
    return res.status(200).json({
      message: `Switched to ${provider.name}`,
      type: provider.type,
      name: provider.name
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ error: message });
  }
});

/**
 * POST /api/llm/provider/:type/config
 * 
 * Update configuration for a specific provider
 */
router.post("/provider/:type/config", async (req: Request, res: Response) => {
  try {
    const { type } = req.params as { type: LLMProviderType };
    const config = req.body;
    
    llmManager.updateProviderConfig(type, config);
    
    const provider = llmManager.getProvider(type);
    return res.status(200).json({
      message: `Configuration updated for ${type}`,
      config: provider?.getConfig()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(400).json({ error: message });
  }
});

/**
 * POST /api/llm/check
 * 
 * Check availability of all providers
 */
router.post("/check", async (_req: Request, res: Response) => {
  try {
    const results = await llmManager.checkAllAvailability();
    const availability: Record<string, boolean> = {};
    
    results.forEach((available, type) => {
      availability[type] = available;
    });
    
    return res.status(200).json({
      availability,
      activeProvider: llmManager.getActiveProviderType()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

/**
 * POST /api/llm/test
 * 
 * Test the active LLM provider with a simple prompt
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body as { prompt?: string };
    const testPrompt = prompt || "Hello, please respond with a brief greeting.";
    
    const response = await llmManager.complete(testPrompt);
    
    return res.status(200).json({
      prompt: testPrompt,
      response: response.content,
      source: response.source,
      provider: response.provider,
      model: response.model,
      error: response.error
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

export default router;

