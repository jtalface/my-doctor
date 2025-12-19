// ============================================
// MYDOCTOR WEB APP - TYPE DEFINITIONS
// ============================================

// Session Types
export interface Session {
  id: string;
  userId: string;
  type: SessionType;
  startTime: Date;
  endTime?: Date;
  currentState: string;
  isTerminal: boolean;
  status: 'active' | 'completed' | 'abandoned';
}

export type SessionType = 'annual-checkup' | 'symptom-check' | 'medication-review';

// State Machine Types
export interface NodeState {
  id: string;
  prompt: string;
  helpText?: string;
  inputType: InputType;
  choices?: string[];
  validation?: ValidationRule[];
  isTerminal: boolean;
}

export type InputType = 'choice' | 'text' | 'structured' | 'none';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern';
  value?: number | string;
  message: string;
}

// Conversation Types
export interface HistoryStep {
  nodeId: string;
  prompt: string;
  input: string;
  response: string;
  reasoning?: ReasoningResult;
  timestamp: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Medical Reasoning Types
export interface ReasoningResult {
  scores: HealthScores;
  redFlags: RedFlag[];
  recommendations: string[];
  screeningSuggestions: ScreeningRecommendation[];
}

export interface HealthScores {
  bmi?: number;
  cardiovascularRisk?: RiskLevel;
  mentalHealth?: HealthStatus;
  [key: string]: number | string | undefined;
}

export type RiskLevel = 'low' | 'moderate' | 'high';
export type HealthStatus = 'good' | 'monitor' | 'concern';

export interface RedFlag {
  id: string;
  label: string;
  severity: 'low' | 'moderate' | 'high';
  reason: string;
  recommendation: string;
}

export interface ScreeningRecommendation {
  name: string;
  reason: string;
  urgency: 'routine' | 'soon' | 'overdue';
  lastCompleted?: Date;
  nextDue?: Date;
}

// Session Summary Types
export interface SessionSummary {
  sessionId: string;
  userId: string;
  type: SessionType;
  startTime: Date;
  endTime: Date;
  duration: number;
  healthScores: HealthScores;
  flaggedItems: RedFlag[];
  screeningRecommendations: ScreeningRecommendation[];
  aiSummary: string;
  transcript: HistoryStep[];
}

// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  profile?: PatientProfile;
}

export interface PatientProfile {
  dateOfBirth?: Date;
  sexAtBirth?: 'male' | 'female' | 'other';
  height?: number; // cm
  weight?: number; // kg
  allergies?: string[];
  chronicConditions?: string[];
  medications?: string[];
  smokingStatus?: 'never' | 'former' | 'current';
  alcoholUse?: 'none' | 'occasional' | 'moderate' | 'heavy';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  currentState: string;
  prompt: string;
  inputType: InputType;
  choices?: string[];
}

export interface SubmitInputResponse {
  previousState: string;
  currentState: string;
  prompt: string;
  inputType: InputType;
  choices?: string[];
  response: string;
  reasoning?: ReasoningResult;
  isTerminal: boolean;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  code?: string;
  message?: string;
  retryable?: boolean;
}

// Component Prop Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

