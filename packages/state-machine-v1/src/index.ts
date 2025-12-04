// Types
export * from "./types/states";
export * from "./types/state-machine";

// Core
export { Machine } from "./Machine";
export { StateMachine } from "./StateMachine";
export { Router } from "./Router";
export { Orchestrator } from "./Orchestrator";
export type { OrchestratorDependencies } from "./Orchestrator";

// Modules - Context Memory
export type { SessionMemory, SessionData } from "./modules/ContextMemory/types";
export { InMemorySessionMemory } from "./modules/ContextMemory/InMemorySessionMemory";

// Modules - NLP
export type { NLP } from "./modules/NLP/types";
export { DummyNLP } from "./modules/NLP/DummyNLP";

// Modules - Patient Profile
export type { 
  PatientProfile, 
  PatientProfileStore, 
  Medication, 
  ScreeningRecord, 
  SocialHistory 
} from "./modules/PatientProfile/types";
export { InMemoryProfileStore } from "./modules/PatientProfile/InMemoryProfileStore";

// Modules - Prompt Engine
export { PromptEngine } from "./modules/PromptEngine/PromptEngine";
