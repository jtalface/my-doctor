import { State } from "./state.enum";
import { NodeMap, NodeDef } from "./nodes";

export interface AppContext {
  sessionId: string;
  userId: string;
}

export class StateMachine {
  private state: State;
  private nodes: NodeMap;

  constructor(nodes: NodeMap, initial: State = State.START){
    this.nodes = nodes;
    this.state = initial;
  }

  getState(): State {
    return this.state;
  }

  getNode(): NodeDef {
    return this.nodes[this.state];
  }

  transition(next: State){
    this.state = next;
  }
}
