/**
 * Original nodes - Full annual checkup flow with red flags and actions
 * This is the most comprehensive node definition with structured data storage
 */

import { redFlagDefinitions } from "./red-flags";
import type { RedFlagDefinition } from "./red-flags";
import { createFlowMeta } from "./util";
import type { FlowMeta } from "./util";

// Re-export for convenience
export type { RedFlagDefinition } from "./red-flags";
export { redFlagDefinitions } from "./red-flags";
export type { FlowMeta } from "./util";
export { createFlowMeta, getCurrentDateVersion } from "./util";

// ============================================
// Types
// ============================================

export interface NodeInput {
  type: "choice" | "text" | "structured" | "none";
  choices?: string[];
  fields?: string[];
}

export interface NodeAction {
  type: "store" | "transform_store" | "append_store" | "generate";
  path?: string;
  value?: string | Record<string, unknown>;
  transform?: string;
  timestamp?: string;
}

export interface NodeTransition {
  condition: string;
  next: string;
}

export interface OriginalNodeDef {
  id: string;
  prompt: string;
  input: NodeInput;
  actions: NodeAction[];
  transitions: NodeTransition[];
}

export interface OriginalFlow {
  metadata: FlowMeta;
  red_flag_definitions: RedFlagDefinition[];
  nodes: OriginalNodeDef[];
}

// ============================================
// Flow Definition
// ============================================

export const originalFlow: OriginalFlow = {
  metadata: createFlowMeta(),
  red_flag_definitions: redFlagDefinitions,
  nodes: [
    {
      id: "START",
      prompt: "Hello — I'm a health assistant here to help with a routine check-in. I'm not a substitute for a clinician. Is it OK if I ask some health questions and store your answers to help with future visits? (yes / no)",
      input: {
        type: "choice",
        choices: ["yes", "no", "ask_about_privacy"]
      },
      actions: [],
      transitions: [
        { condition: "equals(input, 'yes')", next: "AGENDA" },
        { condition: "equals(input, 'no')", next: "EPHEMERAL_CONSENT" },
        { condition: "equals(input, 'ask_about_privacy')", next: "PRIVACY_SUMMARY" }
      ]
    },
    {
      id: "PRIVACY_SUMMARY",
      prompt: "I will store your answers (consent will be recorded). Stored fields: demographics, problem list, meds, vitals, screenings, visit notes. You can request deletion anytime. Do you consent to storage? (yes / no)",
      input: { type: "choice", choices: ["yes", "no"] },
      actions: [
        {
          type: "store",
          path: "consent",
          value: { given: "input == 'yes'", timestamp: "now", scope: "annual_checkup_v1" }
        }
      ],
      transitions: [
        { condition: "equals(input, 'yes')", next: "AGENDA" },
        { condition: "equals(input, 'no')", next: "EPHEMERAL_CONSENT" }
      ]
    },
    {
      id: "EPHEMERAL_CONSENT",
      prompt: "Understood. We can proceed but I will not store personal data after this session. Would you like to continue with an anonymous/ephemeral check-in? (yes / no)",
      input: { type: "choice", choices: ["yes", "no"] },
      actions: [
        {
          type: "store",
          path: "consent",
          value: { given: false, timestamp: "now", scope: "ephemeral" }
        }
      ],
      transitions: [
        { condition: "equals(input, 'yes')", next: "AGENDA" },
        { condition: "equals(input, 'no')", next: "END_NOSESSION" }
      ]
    },
    {
      id: "AGENDA",
      prompt: "What would you like to focus on today? (options: routine checkup, specific symptom, medication review, screening only, other) — type the option or briefly describe.",
      input: { type: "text" },
      actions: [
        { type: "store", path: "visit_reason", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "match(input, /chest|pain|faint|breath|shortness/i)", next: "RED_FLAG_SCREEN" },
        { condition: "always", next: "DEMOGRAPHICS" }
      ]
    },
    {
      id: "DEMOGRAPHICS",
      prompt: "Please confirm your age (or year of birth) and sex assigned at birth. You may type 'prefer not to say' for any field.",
      input: { type: "structured", fields: ["age_or_birthyear", "sex_at_birth", "preferred_pronouns_optional"] },
      actions: [
        { type: "store", path: "demographics.age_or_birthyear", value: "input.age_or_birthyear" },
        { type: "store", path: "demographics.sex_at_birth", value: "input.sex_at_birth" },
        { type: "store", path: "demographics.preferred_pronouns", value: "input.preferred_pronouns_optional" }
      ],
      transitions: [
        { condition: "is_missing(input.age_or_birthyear)", next: "DEMOGRAPHICS_ASKAGE" },
        { condition: "always", next: "MEDICAL_HISTORY" }
      ]
    },
    {
      id: "DEMOGRAPHICS_ASKAGE",
      prompt: "If you prefer, tell me an age range (e.g., 20-29, 30-39). Which range applies to you?",
      input: { type: "text" },
      actions: [
        { type: "store", path: "demographics.age_range", value: "input" }
      ],
      transitions: [{ condition: "always", next: "MEDICAL_HISTORY" }]
    },
    {
      id: "MEDICAL_HISTORY",
      prompt: "Do you have any chronic medical conditions I should note? (e.g., diabetes, high blood pressure, asthma, depression). Please list them or say 'none'.",
      input: { type: "text" },
      actions: [
        { type: "transform_store", transform: "parse_conditions(input)", path: "problems" }
      ],
      transitions: [
        { condition: "match(input, /diabet|sugar|hypertension|high blood pressure|asthma|COPD|depress/i)", next: "MED_HISTORY_FOLLOWUP" },
        { condition: "always", next: "MEDICATIONS" }
      ]
    },
    {
      id: "MED_HISTORY_FOLLOWUP",
      prompt: "For each condition you mentioned, please tell me (if you know): year diagnosed, current medications for it, and last monitoring checks (e.g., last HbA1c for diabetes). You can answer briefly or say 'I don't know'.",
      input: { type: "text" },
      actions: [
        { type: "append_store", path: "problems_details", value: "input" }
      ],
      transitions: [{ condition: "always", next: "MEDICATIONS" }]
    },
    {
      id: "MEDICATIONS",
      prompt: "Please list any medicines you take (prescription, OTC, herbal). Include name, dose if known, and how often. If none, type 'none'.",
      input: { type: "text" },
      actions: [
        { type: "transform_store", transform: "parse_med_list(input)", path: "medications" }
      ],
      transitions: [{ condition: "always", next: "ALLERGIES" }]
    },
    {
      id: "ALLERGIES",
      prompt: "Do you have any allergies or bad reactions to medicines, foods, or other things? If yes, please describe the substance and the reaction. If none, type 'none'.",
      input: { type: "text" },
      actions: [
        { type: "transform_store", transform: "parse_allergy_list(input)", path: "allergies" }
      ],
      transitions: [{ condition: "always", next: "SOCIAL_HISTORY" }]
    },
    {
      id: "SOCIAL_HISTORY",
      prompt: "A few quick questions about lifestyle: Do you smoke tobacco? Do you drink alcohol (how often)? Any recreational drug use? Also, is there anything about your housing, work, or ability to afford medications you'd like us to know? (brief answers)",
      input: { type: "text" },
      actions: [
        { type: "transform_store", transform: "parse_social(input)", path: "social_history" }
      ],
      transitions: [{ condition: "always", next: "SYSTEMS_REVIEW_INTRO" }]
    },
    {
      id: "SYSTEMS_REVIEW_INTRO",
      prompt: "I'll do a quick systems review. Answer yes / no / unsure. If yes, I'll ask one follow-up. Ready? (yes)",
      input: { type: "choice", choices: ["yes", "no", "later"] },
      actions: [],
      transitions: [
        { condition: "equals(input, 'yes')", next: "SYSTEMS_CARDIO" },
        { condition: "equals(input, 'no')", next: "PREVENTIVE_SCREENINGS" },
        { condition: "equals(input, 'later')", next: "PREVENTIVE_SCREENINGS" }
      ]
    },
    {
      id: "SYSTEMS_CARDIO",
      prompt: "Cardio: In the last weeks, have you had chest pain, pressure, palpitations, fainting, or passing out? (yes / no / unsure).",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.cardiovascular", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes')", next: "SYSTEMS_CARDIO_FOLLOWUP" },
        { condition: "match_input_against_redflags()", next: "ESCALATE" },
        { condition: "equals(input, 'no')", next: "SYSTEMS_RESP" },
        { condition: "equals(input, 'unsure')", next: "SYSTEMS_RESP" }
      ]
    },
    {
      id: "SYSTEMS_CARDIO_FOLLOWUP",
      prompt: "Can you briefly describe the chest symptoms: when they happen (at rest or with activity), duration, and any other symptoms like sweating or arm/neck jaw pain?",
      input: { type: "text" },
      actions: [
        { type: "append_store", path: "systems.cardiovascular_details", value: "input" }
      ],
      transitions: [
        { condition: "match( input, /sweat|faint|radiat|pressure|severe/i )", next: "ESCALATE" },
        { condition: "always", next: "SYSTEMS_RESP" }
      ]
    },
    {
      id: "SYSTEMS_RESP",
      prompt: "Respiratory: new or worsening cough, shortness of breath, or wheeze? (yes / no / unsure)",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.respiratory", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes') and match_input_against_redflags()", next: "ESCALATE" },
        { condition: "equals(input, 'yes')", next: "SYSTEMS_RESP_FOLLOWUP" },
        { condition: "always", next: "SYSTEMS_GI" }
      ]
    },
    {
      id: "SYSTEMS_RESP_FOLLOWUP",
      prompt: "How long have you had this symptom? Is it worse with exertion or at rest? Any blood when coughing or high fever?",
      input: { type: "text" },
      actions: [
        { type: "append_store", path: "systems.respiratory_details", value: "input" }
      ],
      transitions: [
        { condition: "match(input, /blood|high fever|cannot breathe|very breathless/i)", next: "ESCALATE" },
        { condition: "always", next: "SYSTEMS_GI" }
      ]
    },
    {
      id: "SYSTEMS_GI",
      prompt: "Gastrointestinal: new abdominal pain, vomiting, blood in stool, or unexplained severe change in appetite/weight? (yes / no / unsure)",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.gi", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes') and match(input, /severe|bloody|vomit|can't keep food/i)", next: "ESCALATE" },
        { condition: "always", next: "SYSTEMS_NEURO" }
      ]
    },
    {
      id: "SYSTEMS_NEURO",
      prompt: "Neurologic: recent severe headache, sudden weakness, vision change, slurred speech, or fainting? (yes / no / unsure)",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.neuro", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes') and match_input_against_redflags()", next: "ESCALATE" },
        { condition: "always", next: "SYSTEMS_MSK" }
      ]
    },
    {
      id: "SYSTEMS_MSK",
      prompt: "Musculoskeletal: persistent joint or back pain limiting daily activities? (yes / no / unsure)",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.msk", value: "input", timestamp: "now" }
      ],
      transitions: [{ condition: "always", next: "SYSTEMS_PSYCH" }]
    },
    {
      id: "SYSTEMS_PSYCH",
      prompt: "Mental health: Have you been feeling down, depressed, or that you have little interest in doing things? (yes / no / unsure) — if yes, I may ask two short follow-ups.",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "systems.psych", value: "input", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes')", next: "PHQ2" },
        { condition: "always", next: "PREVENTIVE_SCREENINGS" }
      ]
    },
    {
      id: "PHQ2",
      prompt: "Over the past 2 weeks, how often have you been bothered by: (1) Little interest or pleasure in doing things? (not at all / several days / more than half the days / nearly every day)",
      input: { type: "choice", choices: ["not at all", "several days", "more than half the days", "nearly every day"] },
      actions: [
        { type: "append_store", path: "screenings.phq2_q1", value: "input" }
      ],
      transitions: [{ condition: "always", next: "PHQ2_Q2" }]
    },
    {
      id: "PHQ2_Q2",
      prompt: "(2) Feeling down, depressed, or hopeless? (same scale).",
      input: { type: "choice", choices: ["not at all", "several days", "more than half the days", "nearly every day"] },
      actions: [
        { type: "append_store", path: "screenings.phq2_q2", value: "input" }
      ],
      transitions: [{ condition: "always", next: "PREVENTIVE_SCREENINGS" }]
    },
    {
      id: "PREVENTIVE_SCREENINGS",
      prompt: "Based on age and sex, there are common preventive checks (BP check, diabetes screening, cholesterol, cancer screens, vaccinations). Would you like me to check which of these might be due for you and explain? (yes / no)",
      input: { type: "choice", choices: ["yes", "no"] },
      actions: [],
      transitions: [
        { condition: "equals(input, 'yes')", next: "PREVENTIVE_CHECKLIST" },
        { condition: "equals(input, 'no')", next: "SUMMARY_PLAN" }
      ]
    },
    {
      id: "PREVENTIVE_CHECKLIST",
      prompt: "Quickly: When was your last blood pressure check? (within 1 year / >1 year / never / unsure)",
      input: { type: "choice", choices: ["within 1 year", ">1 year", "never", "unsure"] },
      actions: [
        { type: "store", path: "screenings.bp_last", value: "input" }
      ],
      transitions: [{ condition: "always", next: "PREVENTIVE_LIPIDS" }]
    },
    {
      id: "PREVENTIVE_LIPIDS",
      prompt: "When was your last cholesterol test (lipid panel)? (within 1 year / >1 year / never / unsure)",
      input: { type: "choice", choices: ["within 1 year", ">1 year", "never", "unsure"] },
      actions: [
        { type: "store", path: "screenings.lipids_last", value: "input" }
      ],
      transitions: [{ condition: "always", next: "PREVENTIVE_DIABETES" }]
    },
    {
      id: "PREVENTIVE_DIABETES",
      prompt: "If applicable: When was your last blood sugar or HbA1c test? (within 1 year / >1 year / never / unsure / not applicable)",
      input: { type: "choice", choices: ["within 1 year", ">1 year", "never", "unsure", "not applicable"] },
      actions: [
        { type: "store", path: "screenings.hba1c_last", value: "input" }
      ],
      transitions: [{ condition: "always", next: "VACCINATIONS" }]
    },
    {
      id: "VACCINATIONS",
      prompt: "Are you up to date on routine adult immunizations like tetanus, annual flu vaccine, and COVID-19 boosters? (yes / no / unsure)",
      input: { type: "choice", choices: ["yes", "no", "unsure"] },
      actions: [
        { type: "store", path: "vaccinations.status", value: "input" }
      ],
      transitions: [{ condition: "always", next: "SUMMARY_PLAN" }]
    },
    {
      id: "SUMMARY_PLAN",
      prompt: "Summary: I have recorded your key items. Based on this visit, suggested educational next steps are: [auto-generated bullets]. Would you like a visit summary saved to your record and reminders set? (save_and_set_reminders / save_only / do_not_save)",
      input: { type: "choice", choices: ["save_and_set_reminders", "save_only", "do_not_save"] },
      actions: [
        { type: "generate", path: "visit_summary", value: "auto_summarize_current_session()" }
      ],
      transitions: [
        { condition: "equals(input, 'save_and_set_reminders')", next: "SAVING_AND_REMINDERS" },
        { condition: "equals(input, 'save_only')", next: "SAVING" },
        { condition: "equals(input, 'do_not_save')", next: "END_EPHEMERAL" }
      ]
    },
    {
      id: "SAVING_AND_REMINDERS",
      prompt: "Ok — I will save this visit and create reminders for the items discussed (e.g., BP check in 1 month). What frequency or date would you like for the reminders? (give date or interval like '3 months')",
      input: { type: "text" },
      actions: [
        { type: "store", path: "visit_notes", value: "visit_summary", timestamp: "now" },
        { type: "store", path: "reminders", value: "parse_reminder(input)" }
      ],
      transitions: [{ condition: "always", next: "END_OK" }]
    },
    {
      id: "SAVING",
      prompt: "Saving the visit summary now. Done. Would you like a copy of the summary text now or emailed? (copy / email / no)",
      input: { type: "choice", choices: ["copy", "email", "no"] },
      actions: [
        { type: "store", path: "visit_notes", value: "visit_summary", timestamp: "now" }
      ],
      transitions: [{ condition: "always", next: "END_OK" }]
    },
    {
      id: "ESCALATE",
      prompt: "I'm concerned by the symptoms you described — they can be serious. I recommend you seek in-person urgent care or emergency services now. If you are in immediate danger, call your local emergency number. Would you like a short summary you can share with a clinician? (yes / no)",
      input: { type: "choice", choices: ["yes", "no"] },
      actions: [
        { type: "store", path: "red_flags", value: "latest_answers_matching_redflags()", timestamp: "now" }
      ],
      transitions: [
        { condition: "equals(input, 'yes')", next: "ESCALATE_SUMMARY" },
        { condition: "equals(input, 'no')", next: "END_ESCALATED" }
      ]
    },
    {
      id: "ESCALATE_SUMMARY",
      prompt: "Here is a brief summary you can share with an in-person clinician: [auto-generated red-flag summary]. Would you like this copied to clipboard or emailed? (copy / email / no)",
      input: { type: "choice", choices: ["copy", "email", "no"] },
      actions: [
        { type: "store", path: "escalation_summary_sent", value: "input" }
      ],
      transitions: [{ condition: "always", next: "END_ESCALATED" }]
    },
    {
      id: "END_OK",
      prompt: "Thanks — your visit is complete. If you have new or urgent symptoms, start a new session or seek immediate care. Would you like help finding local resources? (yes / no)",
      input: { type: "choice", choices: ["yes", "no"] },
      actions: [],
      transitions: [{ condition: "always", next: "END" }]
    },
    {
      id: "END_ESCALATED",
      prompt: "I have provided urgent guidance and stored the red-flag summary. Please seek urgent care as advised. End of session.",
      input: { type: "none" },
      actions: [],
      transitions: [{ condition: "always", next: "END" }]
    },
    {
      id: "END_EPHEMERAL",
      prompt: "This session will not be saved. If you want to save later, start another session and consent. End of session — take care.",
      input: { type: "none" },
      actions: [],
      transitions: [{ condition: "always", next: "END" }]
    },
    {
      id: "END_NOSESSION",
      prompt: "No problem — if you change your mind, you can start a check-in anytime. Goodbye.",
      input: { type: "none" },
      actions: [],
      transitions: [{ condition: "always", next: "END" }]
    },
    {
      id: "END",
      prompt: "SESSION CLOSED",
      input: { type: "none" },
      actions: [],
      transitions: []
    }
  ]
};

// ============================================
// Convenience exports
// ============================================

export const originalNodes = originalFlow.nodes;

