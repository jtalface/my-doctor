import { State } from "../state.enum";

export interface NodeDef {
  id: State;
  prompt: string;
  inputType: "choice" | "text" | "none";
  choices?: string[];
  controller?: string; // which controller/module to involve (optional)
  transitions: { condition: string; next: State }[];
}

// Partial because different flows use different subsets of states
export type NodeMap = Partial<Record<State, NodeDef>>;

