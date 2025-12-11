import { StateMachineLoader, stateMachineLoader } from "../state/loader";
import { StateMachineNode, NodeController, ControllerContext } from "../state/types";
import { SessionMemoryService } from "../services/session-memory.service";
import { RiskService } from "../services/risk.service";
import { ScreeningService } from "../services/screening.service";
import { PromptEngineService } from "../services/prompt-engine.service";
import { RouterService } from "../services/router.service";
import { MedicalReasoningEngine, ReasoningResult } from "../reasoning";
import {
  SessionRepository,
  SessionMemoryRepository,
  PatientProfileRepository,
  ReasoningRecordRepository,
  HealthRecordRepository,
  IPatientProfile,
  ISessionStep
} from "../models";

interface OrchestratorContext {
  userId: string;
  sessionId: string;
}

interface HandleInputResult {
  response: string;
  currentState: string;
  nextState: string;
  node: StateMachineNode;
  reasoning?: ReasoningResult;
  isTerminal: boolean;
}

/**
 * Orchestrator with Reasoning
 * 
 * Coordinates the flow of a medical check-in session:
 * 1. Loads current state
 * 2. Runs controller preprocess
 * 3. Runs Medical Reasoning Engine
 * 4. Stores memory + reasoning
 * 5. Calls PromptEngine.generate
 * 6. Runs controller postprocess
 * 7. Uses Router to determine next state
 * 8. Saves updated session + session memory
 */
export class OrchestratorWithReasoning {
  private loader: StateMachineLoader;
  private sessionRepo: SessionRepository;
  private memoryRepo: SessionMemoryRepository;
  private profileRepo: PatientProfileRepository;
  private reasoningRepo: ReasoningRecordRepository;
  private healthRecordRepo: HealthRecordRepository;
  
  private memoryService: SessionMemoryService;
  private riskService: RiskService;
  private screeningService: ScreeningService;
  private promptEngine: PromptEngineService;
  private router: RouterService;
  private reasoningEngine: MedicalReasoningEngine;

  constructor() {
    // Load state machine
    this.loader = stateMachineLoader;
    this.loader.load();

    // Repositories
    this.sessionRepo = new SessionRepository();
    this.memoryRepo = new SessionMemoryRepository();
    this.profileRepo = new PatientProfileRepository();
    this.reasoningRepo = new ReasoningRecordRepository();
    this.healthRecordRepo = new HealthRecordRepository();

    // Services
    this.memoryService = new SessionMemoryService();
    this.riskService = new RiskService();
    this.screeningService = new ScreeningService();
    
    // Enable debug mode via DEBUG_MODE environment variable
    const debugMode = process.env.DEBUG_MODE === 'true';
    this.promptEngine = new PromptEngineService(debugMode);
    
    this.router = new RouterService();
    this.reasoningEngine = new MedicalReasoningEngine();
  }

  /**
   * Start a new session
   */
  async startSession(userId: string): Promise<{
    sessionId: string;
    state: string;
    node: StateMachineNode;
    prompt: string;
  }> {
    // Create session
    const session = await this.sessionRepo.create(userId);
    const sessionId = session._id.toString();

    // Initialize session memory
    await this.memoryService.initialize(sessionId, userId);

    // Ensure patient profile exists
    await this.profileRepo.findOrCreate(userId);

    // Ensure health record exists
    await this.healthRecordRepo.findOrCreate(userId);

    // Get initial state and node
    const initialState = this.loader.getInitialState();
    const node = this.loader.getNode(initialState);

    if (!node) {
      throw new Error(`Initial state node not found: ${initialState}`);
    }

    return {
      sessionId,
      state: initialState,
      node,
      prompt: node.prompt
    };
  }

  /**
   * Handle user input and process through the pipeline
   */
  async handleInput(
    userInput: string,
    ctx: OrchestratorContext
  ): Promise<HandleInputResult> {
    const { userId, sessionId } = ctx;

    // ---------------------------------------------------------------
    // 1. LOAD CURRENT STATE
    // ---------------------------------------------------------------
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const currentState = session.currentState;
    const node = this.loader.getNode(currentState);
    
    if (!node) {
      throw new Error(`Node not found for state: ${currentState}`);
    }

    // Load profile and memory
    const profile = await this.profileRepo.findByUserId(userId);
    const memoryDoc = await this.memoryService.get(sessionId);
    const memory = memoryDoc?.context || {};

    // Get controller if exists
    const controller = this.loader.getController(currentState);

    // Build controller context
    const controllerCtx: ControllerContext = {
      userId,
      sessionId,
      state: currentState,
      input: userInput,
      memory,
      profile: profile ? this.profileToRecord(profile) : undefined,
      risk: this.riskService,
      screening: this.screeningService
    };

    let processedInput: unknown = userInput;
    let extraData: Record<string, unknown> = {};
    let overrideResponse: string | undefined;
    let overrideNextState: string | undefined;

    // ---------------------------------------------------------------
    // 2. CONTROLLER PREPROCESS
    // ---------------------------------------------------------------
    if (controller?.preprocess) {
      try {
        const result = await controller.preprocess(controllerCtx);
        
        if (result?.overrideNextState) {
          overrideNextState = result.overrideNextState;
        }
        if (result?.overrideResponse) {
          overrideResponse = result.overrideResponse;
        }
        if (result?.modifiedInput !== undefined) {
          processedInput = result.modifiedInput;
        }
        if (result?.extraData) {
          extraData = { ...extraData, ...result.extraData };
        }
      } catch (error) {
        console.error(`[Orchestrator] Preprocess error for ${currentState}:`, error);
      }
    }

    // Update memory with controller data
    if (Object.keys(extraData).length > 0) {
      await this.memoryService.mergeContext(sessionId, extraData);
    }

    // ---------------------------------------------------------------
    // 3. MEDICAL REASONING ENGINE
    // ---------------------------------------------------------------
    const updatedMemory = { ...memory, ...extraData };
    
    const reasoning = await this.reasoningEngine.analyze({
      userId,
      sessionId,
      state: currentState,
      input: processedInput,
      memory: updatedMemory,
      profile: profile ? this.profileToRecord(profile) : undefined
    });

    // Store reasoning record
    await this.reasoningRepo.create({
      sessionId,
      userId,
      nodeId: currentState,
      redFlags: reasoning.redFlags,
      scores: reasoning.scores,
      recommendations: reasoning.recommendations,
      notes: reasoning.notes,
      overrideNextState: reasoning.overrideNextState
    });

    // Store red flags in health record if any high severity
    const highSeverityFlags = reasoning.redFlags.filter(rf => rf.severity === "high");
    for (const flag of highSeverityFlags) {
      await this.healthRecordRepo.addRedFlagEvent(userId, {
        date: new Date(),
        sessionId,
        nodeId: currentState,
        flagId: flag.id,
        label: flag.label,
        reason: flag.reason,
        severity: flag.severity
      });
    }

    // Check for reasoning override
    if (reasoning.overrideNextState && !overrideNextState) {
      overrideNextState = reasoning.overrideNextState;
    }

    // ---------------------------------------------------------------
    // 4. PROMPT ENGINE (LLM Generation)
    // ---------------------------------------------------------------
    let response: string;
    let llmSource: "llm" | "fallback" = "fallback";

    if (overrideResponse) {
      response = overrideResponse;
    } else {
      // Build conversation history
      const conversationHistory = await this.memoryService.buildConversationSummary(sessionId);

      const generateResult = await this.promptEngine.generate({
        nodePrompt: node.prompt,
        userInput: String(processedInput),
        profile: profile || undefined,
        conversationHistory: conversationHistory.slice(-2000), // Limit context
        reasoning: {
          scores: reasoning.scores,
          recommendations: reasoning.recommendations,
          notes: reasoning.notes
        }
      });

      response = generateResult.response;
      llmSource = generateResult.source;

      // Log LLM status for debugging
      if (generateResult.error) {
        console.log(`[Orchestrator] LLM fallback used: ${generateResult.error}`);
      }
    }

    // ---------------------------------------------------------------
    // 5. CONTROLLER POSTPROCESS
    // ---------------------------------------------------------------
    if (controller?.postprocess && !overrideResponse) {
      try {
        const result = await controller.postprocess({
          ...controllerCtx,
          memory: updatedMemory,
          llmResponse: response
        });

        if (result?.overrideResponse) {
          response = result.overrideResponse;
        }
        if (result?.overrideNextState && !overrideNextState) {
          overrideNextState = result.overrideNextState;
        }
        if (result?.extraData) {
          await this.memoryService.mergeContext(sessionId, result.extraData);
        }
      } catch (error) {
        console.error(`[Orchestrator] Postprocess error for ${currentState}:`, error);
      }
    }

    // ---------------------------------------------------------------
    // 6. APPEND STEP TO MEMORY
    // ---------------------------------------------------------------
    const step: ISessionStep = {
      nodeId: currentState,
      timestamp: new Date(),
      input: String(userInput),
      response,
      controllerData: Object.keys(extraData).length > 0 ? extraData : undefined,
      reasoning: {
        redFlags: reasoning.redFlags,
        scores: reasoning.scores
      }
    };
    await this.memoryRepo.appendStep(sessionId, step);

    // ---------------------------------------------------------------
    // 7. ROUTE TO NEXT STATE
    // ---------------------------------------------------------------
    let nextState: string;

    if (overrideNextState) {
      nextState = overrideNextState;
    } else {
      nextState = await this.router.nextState(
        currentState,
        node,
        String(processedInput),
        updatedMemory
      );
    }

    // ---------------------------------------------------------------
    // 8. UPDATE SESSION STATE
    // ---------------------------------------------------------------
    await this.sessionRepo.updateState(sessionId, nextState);

    // Check if terminal
    const nextNode = this.loader.getNode(nextState);
    const isTerminal = !nextNode || this.router.isTerminalState(nextNode);

    // If terminal, mark session as ended
    if (isTerminal) {
      await this.sessionRepo.endSession(sessionId);
    }

    // ---------------------------------------------------------------
    // 9. RETURN RESULT
    // ---------------------------------------------------------------
    return {
      response,
      currentState,
      nextState,
      node: nextNode || node,
      reasoning,
      isTerminal
    };
  }

  /**
   * Get current session state
   */
  async getSessionState(sessionId: string): Promise<{
    session: unknown;
    memory: unknown;
    currentNode: StateMachineNode | undefined;
  }> {
    const session = await this.sessionRepo.findById(sessionId);
    const memory = await this.memoryService.get(sessionId);
    const currentNode = session ? this.loader.getNode(session.currentState) : undefined;

    return {
      session,
      memory,
      currentNode
    };
  }

  /**
   * Get node by state
   */
  getNode(state: string): StateMachineNode | undefined {
    return this.loader.getNode(state);
  }

  /**
   * Convert profile document to record
   */
  private profileToRecord(profile: IPatientProfile): Record<string, unknown> {
    return {
      demographics: {
        age: profile.demographics.age,
        birthYear: profile.demographics.birthYear,
        sexAtBirth: profile.demographics.sexAtBirth,
        heightM: profile.demographics.heightM,
        weightKg: profile.demographics.weightKg
      },
      socialHistory: profile.socialHistory,
      allergies: profile.allergies,
      chronicConditions: profile.chronicConditions,
      medications: profile.medications
    };
  }
}

// Export singleton instance
export const orchestrator = new OrchestratorWithReasoning();

