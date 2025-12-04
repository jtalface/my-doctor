import { StateMachine } from "./StateMachine";
import { Router } from "./Router";
import { State } from "./types/states";
import { AppContext } from "./types/state-machine";
import { PatientProfileStore } from "../modules/PatientProfile/types";
import { SessionMemory } from "../modules/ContextMemory/types";
import { NLP } from "../modules/NLP/types";
import { PromptEngine } from "../modules/PromptEngine/PromptEngine";

export interface OrchestratorDependencies {
  profileStore: PatientProfileStore;
  sessionMemory: SessionMemory;
  nlp: NLP;
  promptEngine: PromptEngine;
  router: Router;
}

export class Orchestrator {
  private stateMachine: StateMachine;
  private deps: OrchestratorDependencies;

  constructor(deps: OrchestratorDependencies) {
    this.stateMachine = new StateMachine();
    this.deps = deps;
  }

  getStateMachine(): StateMachine {
    return this.stateMachine;
  }

  getCurrentState(): State {
    return this.stateMachine.getCurrentState();
  }

  getCurrentPrompt(): string {
    return this.stateMachine.getPrompt();
  }

  async handleInput(userInput: string, context: AppContext): Promise<string> {
    const current = this.stateMachine.getCurrentState();

    // Load profile & session memory
    const profile = await this.deps.profileStore.load(context.userId);
    const memory = await this.deps.sessionMemory.recall(context.sessionId);

    // Build prompt with context
    const prompt = this.deps.promptEngine.buildPrompt(
      this.stateMachine.getNode().prompt,
      profile,
      memory
    );

    // Call NLP to generate response
    const modelOutput = await this.deps.nlp.complete(prompt + "\nUser: " + userInput);

    // Store interaction in session memory
    await this.deps.sessionMemory.store(context.sessionId, {
      lastInput: userInput,
      lastOutput: modelOutput,
      lastState: current
    });

    // Determine and transition to next state
    const next = await this.deps.router.nextState(current, userInput);
    this.stateMachine.setState(next);

    return modelOutput;
  }

  async startSession(context: AppContext): Promise<string> {
    // Initialize session
    await this.deps.sessionMemory.store(context.sessionId, {
      startedAt: new Date().toISOString(),
      userId: context.userId
    });

    return this.stateMachine.getPrompt();
  }

  async endSession(context: AppContext): Promise<void> {
    await this.deps.sessionMemory.clear(context.sessionId);
  }

  reset(): void {
    this.stateMachine.reset();
  }
}

