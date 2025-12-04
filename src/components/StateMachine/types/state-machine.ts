import { State } from "./states";

export interface StateTransition {
  condition: string;
  next: State;
}

export interface StateDefinition {
  id: State;
  prompt: string;
  inputType?: "text" | "choice" | "structured" | "none";
  choices?: string[];
  controller?: string;
  transitions: StateTransition[];
}

export type StateMachineDefinition = Record<State, StateDefinition>;

export interface AppContext {
  sessionId: string;
  userId: string;
  state?: State;
}
