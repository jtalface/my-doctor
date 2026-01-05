// Dataset types
export interface ScoringDimension {
  name: string;
  weight: number;
  description: string;
}

export interface GradeBand {
  band: string;
  min_score: number;
  override_if_unsafe?: boolean;
}

export interface GlobalScoring {
  scale: string;
  dimensions: ScoringDimension[];
  automatic_grade_bands: GradeBand[];
  unsafe_override_rules: string[];
}

export interface SafetyFlags {
  red_flags?: string[];
  required_escalation: boolean;
}

export interface ScoringRubricCriteria {
  points: number;
  must_include?: string[];
  must_include_any?: string[];
  must_avoid?: string[];
  must_show?: string;
  notes?: string;
}

export interface ScoringRubricDimension {
  max: number;
  criteria: ScoringRubricCriteria[];
}

export interface ScoringRubric {
  clinical_accuracy: ScoringRubricDimension;
  reasoning_quality: ScoringRubricDimension;
  safety_and_escalation: ScoringRubricDimension;
  uncertainty_handling: ScoringRubricDimension;
  africa_context_fit: ScoringRubricDimension;
}

export interface UnsafeOverride {
  if_contains_any: string[];
  action: string;
}

export interface AutoScoring {
  positive_keywords: string[];
  negative_keywords: string[];
  unsafe_override?: UnsafeOverride;
}

export interface GoldAnswer {
  short: string;
  expanded: string[];
}

export interface EvalItem {
  id: string;
  title: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'high';
  question: string;
  gold_answer: GoldAnswer;
  key_points: string[];
  safety_flags: SafetyFlags;
  scoring_rubric: ScoringRubric;
  auto_scoring: AutoScoring;
}

export interface EvalDataset {
  dataset_name: string;
  version: string;
  locale_focus: string;
  notes: string[];
  global_scoring: GlobalScoring;
  items: EvalItem[];
}

// Result types
export interface DimensionScores {
  clinical_accuracy: number;
  reasoning_quality: number;
  safety_and_escalation: number;
  uncertainty_handling: number;
  africa_context_fit: number;
}

export interface ItemResult {
  item_id: string;
  final_score_0_100: number;
  band: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Unsafe/Fail';
  unsafe_flag: boolean;
  dimension_scores: DimensionScores;
  missed_key_points: string[];
  notes: string[];
  response?: string;
}

export interface EvalSummary {
  dataset_name: string;
  version: string;
  avg_score: number;
  unsafe_count: number;
  band_counts: Record<string, number>;
  results: ItemResult[];
  timestamp?: string;
}

// API types
export interface LLMConfig {
  baseUrl: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface EvalProgress {
  total: number;
  completed: number;
  current_item_id: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  llm_connected: boolean;
  dataset_loaded: boolean;
  items_count: number;
  model: string;
}

