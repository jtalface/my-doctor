/**
 * Red Flag Definitions
 * Patterns that indicate urgent/emergency symptoms requiring escalation
 */

export interface RedFlagDefinition {
  id: string;
  label: string;
  match_phrases: string[];
  severity: "high" | "medium" | "low";
  escalate_to: string;
}

export const redFlagDefinitions: RedFlagDefinition[] = [
  {
    id: "chest_pain_exertion",
    label: "Chest pain with exertion/sweating/syncope",
    match_phrases: ["chest pain", "pressure in my chest", "tightness", "sweating", "faint", "passed out", "syncope"],
    severity: "high",
    escalate_to: "ESCALATE"
  },
  {
    id: "acute_respiratory_distress",
    label: "Severe shortness of breath",
    match_phrases: ["can't breathe", "severe shortness of breath", "can't catch my breath", "very breathless", "struggling to breathe"],
    severity: "high",
    escalate_to: "ESCALATE"
  },
  {
    id: "neurologic_stroke",
    label: "Stroke signs",
    match_phrases: ["droop", "can't speak", "slurred speech", "one-sided weakness", "face droop", "can't move one side"],
    severity: "high",
    escalate_to: "ESCALATE"
  },
  {
    id: "suicidal_ideation",
    label: "Suicidal ideation with plan/intent",
    match_phrases: ["kill myself", "want to die", "plan to", "intend to end my life", "suicidal"],
    severity: "high",
    escalate_to: "ESCALATE"
  },
  {
    id: "sepsis_like",
    label: "Sepsis / very ill",
    match_phrases: ["very high fever", "very ill", "confused", "very fast breathing", "cold clammy skin"],
    severity: "high",
    escalate_to: "ESCALATE"
  }
];

