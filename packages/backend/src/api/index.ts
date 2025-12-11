import { Router } from "express";
import sessionRoutes from "./session.routes";
import userRoutes from "./user.routes";
import healthRoutes from "./health.routes";
import llmRoutes from "./llm.routes";

const router: Router = Router();

router.use("/session", sessionRoutes);
router.use("/user", userRoutes);
router.use("/health", healthRoutes);
router.use("/llm", llmRoutes);

export default router;

