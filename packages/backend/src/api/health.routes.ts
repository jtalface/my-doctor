import { Router, Request, Response } from "express";
import mongoose from "mongoose";

const router = Router();

/**
 * GET /api/health
 * 
 * Health check endpoint
 */
router.get("/", async (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  const mongoStatus = stateMap[mongoState] || "unknown";

  return res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoStatus
  });
});

/**
 * GET /api/health/ready
 * 
 * Readiness check - only returns OK when fully ready to serve traffic
 */
router.get("/ready", async (_req: Request, res: Response) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  if (!mongoConnected) {
    return res.status(503).json({
      status: "not_ready",
      reason: "MongoDB not connected"
    });
  }

  return res.status(200).json({
    status: "ready"
  });
});

export default router;

