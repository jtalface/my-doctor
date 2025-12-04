// ============================================
// Core
// ============================================
export { State } from "./core/state.enum";
export { StateMachine } from "./core/state-machine";
export type { AppContext } from "./core/state-machine";
export { Orchestrator } from "./core/orchestrator";
export { Router } from "./core/router";
export { mvpNodes, fullNodes } from "./core/nodes";
export type { NodeDef, NodeMap } from "./core/nodes";

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
export { DummyNLP } from "./modules/nlp/dummy";

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

