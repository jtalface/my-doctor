import { StateMachine, AppContext } from "./state-machine";
import { NodeMap } from "./nodes";
import { PatientProfileStore } from "../modules/patient-profile/types";
import { SessionMemory } from "../modules/context-memory/types";
import { NLP } from "../modules/nlp/types";
import { PromptEngine } from "../modules/prompt-engine/prompt-engine";
import { Router } from "./router";
import { Analytics } from "../modules/analytics/types";
import { ScreeningLogic } from "../modules/screening-logic/types";
import { RiskScores } from "../modules/risk-scores/types";
import { Translator } from "../modules/multilingual/types";

interface OrchestratorDeps {
  profileStore: PatientProfileStore;
  sessionMemory: SessionMemory;
  nlp: NLP;
  promptEngine: PromptEngine;
  router: Router;
  analytics: Analytics;
  screening: ScreeningLogic;
  risk: RiskScores;
  translator: Translator;
  nodes: NodeMap;
}

export class Orchestrator {
  private sm: StateMachine;
  private deps: OrchestratorDeps;

  constructor(deps: OrchestratorDeps){
    this.sm = new StateMachine(deps.nodes);
    this.deps = deps;
  }

  async handleInput(userInput: string, context: AppContext){
    const current = this.sm.getState();
    const node = this.sm.getNode();

    // language detection + normalization
    const lang = await this.deps.translator.detect(userInput);
    const normalizedUserInput =
      lang !== "en" ? await this.deps.translator.translate(userInput, "en") : userInput;

    // load profile & session
    const profile = await this.deps.profileStore.load(context.userId);
    const memory = await this.deps.sessionMemory.recall(context.sessionId);

    // build prompt for model
    const prompt = this.deps.promptEngine.buildPrompt(node.prompt, profile, memory);

    // call NLP model
    const llmOutput = await this.deps.nlp.complete(prompt + "\nUser: " + normalizedUserInput);

    // use screening logic for optional next question suggestion (not shown to user in this MVP)
    const screeningQ = await this.deps.screening.nextQuestion(profile, memory, normalizedUserInput);

    // risk example: compute BMI if data exists
    let bmiInfo = "";
    if(profile && profile.weight && profile.height){
      const bmi = this.deps.risk.computeBMI(profile.weight, profile.height);
      bmiInfo = `\n(Internal note: BMI ≈ ${bmi.toFixed(1)})`;
    }

    // analytics event
    this.deps.analytics.track("message", {
      userId: context.userId,
      sessionId: context.sessionId,
      state: current,
      lang
    });

    // store short memory
    await this.deps.sessionMemory.store(context.sessionId, {
      lastOutput: llmOutput,
      lastState: current
    });

    // decide next state
    const next = await this.deps.router.nextState(current, node, normalizedUserInput);
    this.sm.transition(next);

    // Return model output plus a hint of internal reasoning (for debugging)
    return llmOutput + bmiInfo + `\n\n[debug] nextState=${next}, screeningSuggestion="${screeningQ}"`;
  }

  getState(){
    return this.sm.getState();
  }

  getPrompt(){
    return this.sm.getNode().prompt;
  }

  getNode(){
    return this.sm.getNode();
  }

  /**
   * Check if navigation back is possible
   */
  canGoBack(): boolean {
    return this.sm.canGoBack();
  }

  /**
   * Navigate back to the previous state
   * @returns true if navigation was successful, false if no history
   */
  goBack(): boolean {
    const previous = this.sm.goBack();
    if (previous !== null) {
      this.deps.analytics.track("navigation", {
        action: "back",
        fromState: this.sm.getState(),
        toState: previous
      });
      return true;
    }
    return false;
  }

  /**
   * Get the history of visited states
   */
  getHistory() {
    return this.sm.getHistory();
  }
}
