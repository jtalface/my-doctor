import { Router } from "express";
import sessionRoutes from "./session.routes";
import userRoutes from "./user.routes";
import healthRoutes from "./health.routes";

const router = Router();

router.use("/session", sessionRoutes);
router.use("/user", userRoutes);
router.use("/health", healthRoutes);

export default router;

