import { Machine } from "./Machine";
import { State } from "./types/states";

export class StateMachine {
  private current: State = State.GREET;

  getCurrentState(): State {
    return this.current;
  }

  getPrompt(): string {
    return Machine[this.current].prompt;
  }

  getTransitions(): State[] {
    return Machine[this.current].transitions;
  }

  canTransition(to: State): boolean {
    return Machine[this.current].transitions.includes(to);
  }

  transition(to: State): State {
    if (!this.canTransition(to)) {
      throw new Error(
        `Invalid transition: ${this.current} ➜ ${to}`
      );
    }

    this.current = to;
    return this.current;
  }

  reset(): void {
    this.current = State.GREET;
  }
}
