import { State } from "../state.enum";
import type { NodeController } from "../controllers";

export interface NodeDef {
  id: State;
  prompt: string;
  inputType: "choice" | "text" | "none";
  choices?: string[];
  controller?: NodeController;
  transitions: { condition: string; next: State }[];
}

// Partial because different flows use different subsets of states
export type NodeMap = Partial<Record<State, NodeDef>>;

