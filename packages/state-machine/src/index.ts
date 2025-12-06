// ============================================
// Core
// ============================================
export { State } from "./core/state.enum";
export { StateMachine } from "./core/state-machine";
export type { AppContext } from "./core/state-machine";
export { Orchestrator } from "./core/orchestrator";
export { Router } from "./core/router";
export { mvpNodes, standardNodes, extendedNodes } from "./core/nodes";
export type { NodeDef, NodeMap } from "./core/nodes";

// ============================================
// Controllers
// ============================================
export type { 
  NodeController, 
  NodeControllerContext, 
  NodeControllerResult,
  RiskUtils,
  ScreeningUtils
} from "./core/controllers";
export { 
  DemographicsController,
  MedicalHistoryController,
  MedicationsController,
  SystemsReviewController,
  CardioSymptomsController,
  RespiratoryController,
  PreventiveScreeningController,
  SummaryController
} from "./core/controllers";

// Red flags
export { redFlagDefinitions } from "./core/nodes";
export type { RedFlagDefinition } from "./core/nodes";

// Utilities
export { createFlowMeta, getCurrentDateVersion } from "./core/nodes";
export type { FlowMeta } from "./core/nodes";

// Original flow (with actions)
export { originalFlow, originalNodes } from "./core/nodes";
export type { 
  NodeInput, 
  NodeAction, 
  NodeTransition, 
  OriginalNodeDef, 
  OriginalFlow 
} from "./core/nodes";

// ============================================
// Modules - Patient Profile
// ============================================
export type { PatientProfile, PatientProfileStore } from "./modules/patient-profile/types";
export { InMemoryProfileStore } from "./modules/patient-profile/inmemory";

// ============================================
// Modules - Context Memory
// ============================================
export type { SessionMemory } from "./modules/context-memory/types";
export { InMemorySessionMemory } from "./modules/context-memory/inmemory";

// ============================================
// Modules - NLP
// ============================================
export type { NLP } from "./modules/nlp/types";
export { LLM } from "./modules/nlp/llm";

// ============================================
// Modules - Prompt Engine
// ============================================
export { PromptEngine } from "./modules/prompt-engine/prompt-engine";

// ============================================
// Modules - Analytics
// ============================================
export type { Analytics } from "./modules/analytics/types";
export { AnalyticsConsole } from "./modules/analytics/console";

// ============================================
// Modules - Screening Logic
// ============================================
export type { ScreeningLogic } from "./modules/screening-logic/types";
export { ScreeningLogicImpl } from "./modules/screening-logic/screening";

// ============================================
// Modules - Risk Scores
// ============================================
export type { RiskScores } from "./modules/risk-scores/types";
export { RiskScoresImpl } from "./modules/risk-scores/risk-scores";

// ============================================
// Modules - Multilingual
// ============================================
export type { Translator } from "./modules/multilingual/types";
export { TranslatorStub } from "./modules/multilingual/translator";

// ============================================
// Medical Reasoning Engine (re-exported from @mydoctor/medical-reasoning-engine)
// ============================================
export type {
  IMedicalReasoningEngine,
  ReasoningContext,
  ReasoningResult,
  ReasoningScores,
  ReasoningRecommendations,
  RedFlag
} from "@mydoctor/medical-reasoning-engine";
export { MedicalReasoningEngine } from "@mydoctor/medical-reasoning-engine";

