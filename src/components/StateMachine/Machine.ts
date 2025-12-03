import { State } from "./types/states";
import { StateMachineDefinition } from "./types/state-machine";

export const Machine: StateMachineDefinition = {
  [State.GREET]: {
    prompt:
      "You are a friendly wellness assistant. Greet the patient and ask how you can help today.",
    transitions: [State.COLLECT_BASIC_INFO],
  },

  [State.COLLECT_BASIC_INFO]: {
    prompt:
      "Collect age, gender, weight, height, and main concern.",
    transitions: [
      State.SCREENING,
      State.WELLNESS_EDUCATION
    ],
  },

  [State.SCREENING]: {
    prompt:
      "Ask targeted screening questions based on patient concern.",
    transitions: [
      State.WELLNESS_EDUCATION,
      State.FOLLOW_UP
    ],
  },

  [State.WELLNESS_EDUCATION]: {
    prompt:
      "Provide general wellness advice based on data.",
    transitions: [State.FOLLOW_UP],
  },

  [State.FOLLOW_UP]: {
    prompt:
      "Ask if they need anything else.",
    transitions: [State.END],
  },

  [State.END]: {
    prompt:
      "Thank them and close the session.",
    transitions: [],
  },
};
