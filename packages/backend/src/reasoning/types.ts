/**
 * Medical Reasoning Engine Types
 */

export interface RedFlag {
  id: string;
  label: string;
  reason: string;
  severity: "low" | "moderate" | "high";
}

export interface ReasoningScores {
  bmi?: number;
  cardioRisk?: number;
  respiratorySeverity?: number;
  depressionScore?: number;
  [key: string]: number | undefined;
}

export interface ReasoningRecommendations {
  educationTopics: string[];
  screeningSuggestions: string[];
  followUpQuestions: string[];
}

export interface ReasoningResult {
  redFlags: RedFlag[];
  scores: ReasoningScores;
  recommendations: ReasoningRecommendations;
  notes: string[];
  overrideNextState?: string;
}

export interface ReasoningContext {
  userId: string;
  sessionId: string;
  state: string;
  input: unknown;
  memory: Record<string, unknown>;
  profile?: Record<string, unknown>;
}

export interface IMedicalReasoningEngine {
  analyze(ctx: ReasoningContext): Promise<ReasoningResult>;
}

