import { State } from "./state.enum";

export interface NodeDef {
  id: State;
  prompt: string;
  inputType: "choice" | "text" | "none";
  choices?: string[];
  controller?: string; // which controller/module to involve (optional)
  transitions: { condition: string; next: State }[];
}

export type NodeMap = Record<State, NodeDef>;

// Minimal MVP flow: greet, collect basics, give advice, close.
export const mvpNodes: NodeMap = {
  [State.START]: {
    id: State.START,
    prompt:
      "Hi, I’m your wellness assistant. I can help with a quick health check-in. This is for education only, not a medical diagnosis. Ready to start? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.AGENDA },
      { condition: "equals(input,'no')", next: State.END }
    ]
  },
  [State.CONSENT]: {
    id: State.CONSENT,
    prompt:
      "Do you consent to saving your answers to improve future check-ins? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "always", next: State.AGENDA }
    ]
  },
  [State.AGENDA]: {
    id: State.AGENDA,
    prompt:
      "What would you like to focus on today? (e.g., routine checkup, blood pressure, diabetes, lifestyle, general questions)",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.DEMOGRAPHICS }
    ]
  },
  [State.DEMOGRAPHICS]: {
    id: State.DEMOGRAPHICS,
    prompt:
      "To tailor information, please share your age and gender (you can answer like: '30, male').",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.MEDICAL_HISTORY }
    ]
  },
  [State.MEDICAL_HISTORY]: {
    id: State.MEDICAL_HISTORY,
    prompt:
      "Do you have any chronic medical conditions (like diabetes, high blood pressure, asthma, depression)?",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.MEDICATIONS }
    ]
  },
  [State.MEDICATIONS]: {
    id: State.MEDICATIONS,
    prompt:
      "List any medications you take (including herbal/OTC) or type 'none'.",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.SUMMARY }
    ]
  },
  [State.SYSTEMS_REVIEW]: {
    id: State.SYSTEMS_REVIEW,
    prompt:
      "Quick check: do you have any chest pain, trouble breathing, or thoughts of harming yourself right now?",
    inputType: "text",
    transitions: [
      { condition: "match(input,/chest|pain|breath|suicid/i)", next: State.SUMMARY },
      { condition: "always", next: State.SUMMARY }
    ]
  },
  [State.PREVENTIVE]: {
    id: State.PREVENTIVE,
    prompt:
      "Have you had your blood pressure or blood sugar checked in the last year?",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.SUMMARY }
    ]
  },
  [State.SUMMARY]: {
    id: State.SUMMARY,
    prompt:
      "Thanks. I’ll summarize your key points and share some general wellness suggestions.",
    inputType: "none",
    transitions: [
      { condition: "always", next: State.END }
    ]
  },
  [State.END]: {
    id: State.END,
    prompt:
      "Session closed. Remember: this is not a diagnosis. For urgent or worrying symptoms, seek in-person care.",
    inputType: "none",
    transitions: []
  }
};

// Fuller flow: includes consent, systems review and preventive care nodes.
export const fullNodes: NodeMap = {
  [State.START]: {
    id: State.START,
    prompt:
      "Hello — I’m a health assistant for routine check-ins. This is educational only, not a substitute for a doctor. May I ask you some health questions? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'yes')", next: State.CONSENT },
      { condition: "equals(input,'no')", next: State.END }
    ]
  },
  [State.CONSENT]: {
    id: State.CONSENT,
    prompt:
      "Do you consent to storing your answers so we can build a health profile over time? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "always", next: State.AGENDA }
    ]
  },
  [State.AGENDA]: {
    id: State.AGENDA,
    prompt:
      "What would you like to focus on today? (routine checkup, symptom, meds review, screenings, lifestyle, etc.)",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.DEMOGRAPHICS }
    ]
  },
  [State.DEMOGRAPHICS]: {
    id: State.DEMOGRAPHICS,
    prompt:
      "Please share your age, gender, and approximate weight/height if you’re comfortable (e.g. '40, female, 70kg, 1.65m').",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.MEDICAL_HISTORY }
    ]
  },
  [State.MEDICAL_HISTORY]: {
    id: State.MEDICAL_HISTORY,
    prompt:
      "Do you have any chronic medical conditions (diabetes, hypertension, asthma, heart disease, mental health conditions, etc.)?",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.MEDICATIONS }
    ]
  },
  [State.MEDICATIONS]: {
    id: State.MEDICATIONS,
    prompt:
      "List any regular medications or supplements (name and dose if you know it).",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.SYSTEMS_REVIEW }
    ]
  },
  [State.SYSTEMS_REVIEW]: {
    id: State.SYSTEMS_REVIEW,
    prompt:
      "Quick body systems check: any recent chest pain, severe shortness of breath, sudden weakness, or thoughts of harming yourself?",
    inputType: "text",
    transitions: [
      { condition: "match(input,/chest|pain|breath|weak|suicid/i)", next: State.SUMMARY },
      { condition: "always", next: State.PREVENTIVE }
    ]
  },
  [State.PREVENTIVE]: {
    id: State.PREVENTIVE,
    prompt:
      "When was your last blood pressure, blood sugar, or cholesterol check, and are you up to date on basic vaccines (like tetanus or flu)?",
    inputType: "text",
    transitions: [
      { condition: "always", next: State.SUMMARY }
    ]
  },
  [State.SUMMARY]: {
    id: State.SUMMARY,
    prompt:
      "I’ll summarize what you’ve shared and outline some general next steps and preventive care topics you may want to discuss with a clinician.",
    inputType: "none",
    transitions: [
      { condition: "always", next: State.END }
    ]
  },
  [State.END]: {
    id: State.END,
    prompt:
      "Session closed. If you notice urgent or worrying symptoms, please seek in-person medical care or emergency services.",
    inputType: "none",
    transitions: []
  }
};
