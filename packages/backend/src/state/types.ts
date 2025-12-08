/**
 * State Machine Types
 */

export interface StateMachineTransition {
  condition: string;
  next: string;
}

export interface StateMachineNode {
  id: string;
  prompt: string;
  inputType: "choice" | "text" | "none";
  choices?: string[];
  transitions: StateMachineTransition[];
  controller?: string;
  metadata?: Record<string, unknown>;
}

export interface StateMachineDefinition {
  id: string;
  name: string;
  version: string;
  description?: string;
  initialState: string;
  nodes: Record<string, StateMachineNode>;
  metadata?: {
    author?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface NodeController {
  preprocess?(ctx: ControllerContext): Promise<ControllerResult | null>;
  postprocess?(ctx: ControllerContext & { llmResponse: string }): Promise<ControllerResult | null>;
}

export interface ControllerContext {
  userId: string;
  sessionId: string;
  state: string;
  input: unknown;
  memory: Record<string, unknown>;
  profile?: Record<string, unknown>;
  risk: RiskUtils;
  screening: ScreeningUtils;
}

export interface ControllerResult {
  modifiedInput?: unknown;
  extraData?: Record<string, unknown>;
  overrideResponse?: string;
  overrideNextState?: string;
}

export interface RiskUtils {
  computeBMI(weightKg: number, heightM: number): number;
  computeChestPainRisk(text: string, memory: Record<string, unknown>): number;
  respiratorySeverityScore(input: unknown): number;
}

export interface ScreeningUtils {
  recommendScreenings(age: number, sex: string): string[];
  detectCardioRedFlags(text: string): string | null;
  detectRespiratoryRedFlags(text: string): string | null;
}

