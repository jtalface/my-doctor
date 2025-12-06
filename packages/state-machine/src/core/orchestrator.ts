import { StateMachine, AppContext } from "./state-machine";
import { NodeMap } from "./nodes";
import { State } from "./state.enum";
import { PatientProfileStore } from "../modules/patient-profile/types";
import { SessionMemory } from "../modules/context-memory/types";
import { NLP } from "../modules/nlp/types";
import { PromptEngine } from "../modules/prompt-engine/prompt-engine";
import { Router } from "./router";
import { Analytics } from "../modules/analytics/types";
import { ScreeningLogic } from "../modules/screening-logic/types";
import { RiskScores } from "../modules/risk-scores/types";
import { Translator } from "../modules/multilingual/types";
import type { 
  NodeController, 
  NodeControllerContext,
  RiskUtils,
  ScreeningUtils 
} from "./controllers";
import type { 
  IMedicalReasoningEngine, 
  ReasoningContext, 
  ReasoningResult 
} from "@mydoctor/medical-reasoning-engine";

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
  /** Optional medical reasoning engine for hybrid analysis */
  reasoningEngine?: IMedicalReasoningEngine;
}

export class Orchestrator {
  private sm: StateMachine;
  private deps: OrchestratorDeps;
  /** Extra data accumulated during processing (from controller preprocess) */
  private currentExtraData: Record<string, unknown> = {};

  constructor(deps: OrchestratorDeps){
    this.sm = new StateMachine(deps.nodes);
    this.deps = deps;
  }

  /**
   * Build controller context with all necessary dependencies
   */
  private async buildControllerContext(
    context: AppContext,
    input: unknown
  ): Promise<NodeControllerContext> {
    const node = this.sm.getNode();
    const memory = await this.deps.sessionMemory.recall(context.sessionId) || {};

    // Adapt existing modules to controller-expected interfaces
    const riskUtils: RiskUtils = {
      // Controllers can extend these as needed
      computeChestPainRisk: undefined,
      respiratorySeverityScore: undefined
    };

    const screeningUtils: ScreeningUtils = {
      // Controllers can extend these as needed  
      detectCardioRedFlags: undefined,
      recommendScreenings: undefined
    };

    return {
      userId: context.userId,
      sessionId: context.sessionId,
      state: String(node.id),
      input,
      memory: memory as Record<string, unknown>,
      risk: riskUtils,
      screening: screeningUtils
    };
  }

  async handleInput(userInput: string, context: AppContext){
    const current = this.sm.getState();
    const node = this.sm.getNode();
    const controller: NodeController | undefined = node.controller;

    // Reset extra data for this processing cycle
    this.currentExtraData = {};

    // Language detection + normalization
    const lang = await this.deps.translator.detect(userInput);
    const normalizedUserInput =
      lang !== "en" ? await this.deps.translator.translate(userInput, "en") : userInput;

    let processedInput: unknown = normalizedUserInput;

    // ---------------------------------------------------------------
    // 1. PREPROCESS CONTROLLER
    // ---------------------------------------------------------------
    if (controller?.preprocess) {
      const controllerCtx = await this.buildControllerContext(context, processedInput);
      const result = await controller.preprocess(controllerCtx);

      if (result?.overrideNextState) {
        // Controller wants to skip LLM and transition immediately
        this.sm.transition(result.overrideNextState as State);
        this.deps.analytics.track("controller_override", {
          userId: context.userId,
          state: current,
          action: "preprocess_transition",
          nextState: result.overrideNextState
        });
        return result.overrideResponse || "";
      }

      if (result?.overrideResponse) {
        // Controller provides response but doesn't change state yet
        return result.overrideResponse;
      }

      if (result?.modifiedInput !== undefined) {
        processedInput = result.modifiedInput;
      }

      if (result?.extraData) {
        this.currentExtraData = { ...this.currentExtraData, ...result.extraData };
        // Store extra data in session memory
        await this.deps.sessionMemory.store(context.sessionId, {
          ...await this.deps.sessionMemory.recall(context.sessionId),
          [String(node.id)]: result.extraData
        });
      }
    }

    // ---------------------------------------------------------------
    // 2. MEDICAL REASONING ENGINE (Hybrid Analysis)
    // ---------------------------------------------------------------
    let reasoning: ReasoningResult | undefined;
    
    if (this.deps.reasoningEngine) {
      const updatedMemory = await this.deps.sessionMemory.recall(context.sessionId) || {};
      
      const reasoningCtx: ReasoningContext = {
        userId: context.userId,
        sessionId: context.sessionId,
        state: String(node.id),
        input: processedInput,
        memory: updatedMemory as Record<string, unknown>,
        risk: {
          computeBMI: this.deps.risk.computeBMI.bind(this.deps.risk),
          // Add other risk methods as needed
        },
        screening: {
          // Add screening methods as needed
        }
      };

      reasoning = await this.deps.reasoningEngine.analyze(reasoningCtx);

      // Store reasoning result in session memory
      await this.deps.sessionMemory.store(context.sessionId, {
        ...await this.deps.sessionMemory.recall(context.sessionId),
        [`${node.id}_reasoning`]: reasoning
      });

      // If reasoning engine detects high-severity red flags, escalate immediately
      if (reasoning.overrideNextState) {
        this.sm.transition(reasoning.overrideNextState as State);
        this.deps.analytics.track("reasoning_escalation", {
          userId: context.userId,
          state: current,
          redFlags: reasoning.redFlags,
          nextState: reasoning.overrideNextState
        });
        return "I'm concerned about some symptoms or patterns you've described. I recommend seeking in-person medical evaluation promptly.";
      }
    }

    // ---------------------------------------------------------------
    // 3. LOAD PROFILE & BUILD PROMPT
    // ---------------------------------------------------------------
    const profile = await this.deps.profileStore.load(context.userId);
    const memory = await this.deps.sessionMemory.recall(context.sessionId);
    const prompt = this.deps.promptEngine.buildPrompt(node.prompt, profile, memory);

    // ---------------------------------------------------------------
    // 4. PRIMARY LLM GENERATION
    // ---------------------------------------------------------------
    const inputForLLM = typeof processedInput === "string" 
      ? processedInput 
      : JSON.stringify(processedInput);
    const llmOutput = await this.deps.nlp.complete(prompt + "\nUser: " + inputForLLM);
    let finalResponse = llmOutput;

    // ---------------------------------------------------------------
    // 5. POSTPROCESS CONTROLLER
    // ---------------------------------------------------------------
    if (controller?.postprocess) {
      const controllerCtx = await this.buildControllerContext(context, processedInput);
      const result = await controller.postprocess({
        ...controllerCtx,
        llmResponse: llmOutput,
        extraData: this.currentExtraData
      });

      if (result?.overrideResponse) {
        finalResponse = result.overrideResponse;
      }

      if (result?.overrideNextState) {
        // Postprocess can also override next state
        this.sm.transition(result.overrideNextState as State);
        this.deps.analytics.track("controller_override", {
          userId: context.userId,
          state: current,
          action: "postprocess_transition",
          nextState: result.overrideNextState
        });
        return finalResponse;
      }
    }

    // ---------------------------------------------------------------
    // 6. ANALYTICS & MEMORY
    // ---------------------------------------------------------------
    this.deps.analytics.track("message", {
      userId: context.userId,
      sessionId: context.sessionId,
      state: current,
      lang
    });

    await this.deps.sessionMemory.store(context.sessionId, {
      lastOutput: finalResponse,
      lastState: current
    });

    // ---------------------------------------------------------------
    // 7. ROUTE TO NEXT STATE
    // ---------------------------------------------------------------
    const next = await this.deps.router.nextState(current, node, inputForLLM);
    this.sm.transition(next);

    // ---------------------------------------------------------------
    // 8. RETURN RESPONSE
    // ---------------------------------------------------------------
    return finalResponse;
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
