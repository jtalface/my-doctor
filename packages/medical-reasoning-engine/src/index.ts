/**
 * @mydoctor/medical-reasoning-engine
 * 
 * Medical reasoning engine for analyzing patient data,
 * detecting red flags, and generating clinical recommendations.
 */

// Types
export type {
  RedFlag,
  ReasoningScores,
  ReasoningRecommendations,
  ReasoningResult,
  ReasoningContext,
  RiskUtils,
  ScreeningUtils,
  IMedicalReasoningEngine
} from "./types";

// Implementations
export { MedicalReasoningEngine } from "./reasoning-engine";
