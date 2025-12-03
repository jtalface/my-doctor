import { State } from "./states";

export interface StateDefinition {
  prompt: string;
  transitions: State[];
}

export type StateMachineDefinition = Record<State, StateDefinition>;
