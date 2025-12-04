import { Machine } from "./Machine";
import { State } from "./types/states";
import { StateDefinition } from "./types/state-machine";

export class StateMachine {
  private current: State;

  constructor(initial: State = State.START) {
    this.current = initial;
  }

  getCurrentState(): State {
    return this.current;
  }

  getNode(): StateDefinition {
    return Machine[this.current];
  }

  getPrompt(): string {
    return Machine[this.current].prompt;
  }

  getInputType(): StateDefinition["inputType"] {
    return Machine[this.current].inputType;
  }

  getChoices(): string[] | undefined {
    return Machine[this.current].choices;
  }

  getTransitions(): StateDefinition["transitions"] {
    return Machine[this.current].transitions;
  }

  getNextStates(): State[] {
    return Machine[this.current].transitions.map(t => t.next);
  }

  canTransition(to: State): boolean {
    return Machine[this.current].transitions.some(t => t.next === to);
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

  // Direct transition without validation (used by Router)
  setState(state: State): void {
    this.current = state;
  }

  reset(): void {
    this.current = State.START;
  }

  isEndState(): boolean {
    return Machine[this.current].transitions.length === 0;
  }
}
