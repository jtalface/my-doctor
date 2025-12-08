import { Router, Request, Response } from "express";
import { UserRepository, PatientProfileRepository, HealthRecordRepository } from "../models";

const router = Router();
const userRepo = new UserRepository();
const profileRepo = new PatientProfileRepository();
const healthRecordRepo = new HealthRecordRepository();

/**
 * GET /api/user/:id
 * 
 * Get user by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userRepo.findById(id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("[User API] Error getting user:", error);
    return res.status(500).json({
      error: "Failed to get user",
      code: "USER_GET_ERROR"
    });
  }
});

/**
 * GET /api/user/:id/profile
 * 
 * Get patient profile for a user
 */
router.get("/:id/profile", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const profile = await profileRepo.findOrCreate(id);

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("[User API] Error getting profile:", error);
    return res.status(500).json({
      error: "Failed to get profile",
      code: "PROFILE_GET_ERROR"
    });
  }
});

/**
 * PATCH /api/user/:id/profile
 * 
 * Update patient profile
 */
router.patch("/:id/profile", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ensure profile exists
    await profileRepo.findOrCreate(id);

    // Update profile
    const profile = await profileRepo.update(id, updates);

    return res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error("[User API] Error updating profile:", error);
    return res.status(500).json({
      error: "Failed to update profile",
      code: "PROFILE_UPDATE_ERROR"
    });
  }
});

/**
 * GET /api/user/:id/health-record
 * 
 * Get health record for a user
 */
router.get("/:id/health-record", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = await healthRecordRepo.findOrCreate(id);

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error("[User API] Error getting health record:", error);
    return res.status(500).json({
      error: "Failed to get health record",
      code: "HEALTH_RECORD_GET_ERROR"
    });
  }
});

/**
 * GET /api/user/:id/red-flags
 * 
 * Get recent red flags for a user
 */
router.get("/:id/red-flags", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    const redFlags = await healthRecordRepo.getRecentRedFlags(id, limit);

    return res.status(200).json({
      success: true,
      data: redFlags
    });
  } catch (error) {
    console.error("[User API] Error getting red flags:", error);
    return res.status(500).json({
      error: "Failed to get red flags",
      code: "RED_FLAGS_GET_ERROR"
    });
  }
});

export default router;

