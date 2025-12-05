import { State } from "./state.enum";
import { NodeMap, NodeDef } from "./nodes";

export interface AppContext {
  sessionId: string;
  userId: string;
}

export class StateMachine {
  private state: State;
  private nodes: NodeMap;
  private history: State[] = [];

  constructor(nodes: NodeMap, initial: State = State.START){
    this.nodes = nodes;
    this.state = initial;
  }

  getState(): State {
    return this.state;
  }

  getNode(): NodeDef {
    const node = this.nodes[this.state];
    if (!node) {
      throw new Error(`No node defined for state: ${this.state}`);
    }
    return node;
  }

  transition(next: State){
    // Push current state to history before transitioning
    this.history.push(this.state);
    this.state = next;
  }

  /**
   * Check if we can go back to a previous state
   */
  canGoBack(): boolean {
    return this.history.length > 0;
  }

  /**
   * Go back to the previous state
   * @returns The previous state, or null if no history
   */
  goBack(): State | null {
    const previous = this.history.pop();
    if (previous !== undefined) {
      this.state = previous;
      return previous;
    }
    return null;
  }

  /**
   * Get the current history stack (for debugging/display)
   */
  getHistory(): State[] {
    return [...this.history];
  }

  /**
   * Clear history (useful when resetting the flow)
   */
  clearHistory(): void {
    this.history = [];
  }
}
