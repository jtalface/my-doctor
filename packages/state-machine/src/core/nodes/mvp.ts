import { State } from "../state.enum";
import type { NodeMap } from "./types";

// Minimal MVP flow: greet, collect basics, give advice, close.
export const mvpNodes: NodeMap = {
  [State.START]: {
    id: State.START,
    prompt:
      "Hi, I'm your wellness assistant. I can help with a quick health check-in. This is for education only, not a medical diagnosis. Ready to start? (yes / no)",
    inputType: "choice",
    choices: ["yes", "no"],
    transitions: [
      { condition: "equals(input,'no')", next: State.END },
      { condition: "always", next: State.AGENDA }  // Default: any other input proceeds
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
  [State.SUMMARY]: {
    id: State.SUMMARY,
    prompt:
      "Thanks. I'll summarize your key points and share some general wellness suggestions.",
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

