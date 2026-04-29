import { stateLoader, StateNode } from './state-loader.js';
import { sessionMemoryService } from '../services/session-memory.service.js';
import { promptEngineService } from '../services/prompt-engine.service.js';
import { config } from '../config/index.js';
import { User } from '../models/user.model.js';
import { DEFAULT_LANGUAGE } from '../config/languages.js';
import { ISessionStep } from '../models/session.model.js';

export interface OrchestratorResponse {
  sessionId: string;
  sessionType: 'annual-checkup' | 'symptom-check' | 'medication-review';
  currentState: string;
  node: {
    id: string;
    prompt: string;
    helpText?: string;
    inputType: 'choice' | 'text' | 'none';
    choices?: string[];
    isTerminal?: boolean;
    isRedFlag?: boolean;
  };
  llmResponse?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  summary?: {
    redFlags: string[];
    recommendations: string[];
    screenings: string[];
    notes: string;
  };
}

export interface ReasoningResult {
  redFlags: string[];
  recommendations: string[];
  screenings: string[];
  scores: Record<string, number>;
}

class Orchestrator {
  private reasoning: Map<string, ReasoningResult> = new Map();

  async startSession(
    userId: string,
    sessionType: 'annual-checkup' | 'symptom-check' | 'medication-review' = 'annual-checkup'
  ): Promise<OrchestratorResponse> {
    // Load state machine
    stateLoader.load();
    const initialState = stateLoader.getInitialStateForSessionType(sessionType);
    const initialNode = stateLoader.getNode(initialState);

    if (!initialNode) {
      throw new Error('Failed to load initial node');
    }

    // Create session
    const sessionData = await sessionMemoryService.create(userId, initialState, sessionType);
    
    // Initialize reasoning for this session
    this.reasoning.set(sessionData.sessionId, {
      redFlags: [],
      recommendations: [],
      screenings: [],
      scores: {},
    });

    if (config.debugMode) {
      console.log(`[Orchestrator] Started session ${sessionData.sessionId} at state ${initialState}`);
    }

    return this.buildResponse(sessionData.sessionId, sessionType, initialNode);
  }

  async handleInput(sessionId: string, input: any): Promise<OrchestratorResponse> {
    // Get current session
    const sessionData = await sessionMemoryService.get(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentNode = stateLoader.getNode(sessionData.currentState);
    if (!currentNode) {
      throw new Error(`Node ${sessionData.currentState} not found`);
    }

    // Get user language preference
    const user = await User.findById(sessionData.userId);
    const language = user?.preferences?.language || DEFAULT_LANGUAGE;

    // Rebuild reasoning from persisted steps so results survive
    // backend restarts and stay consistent after back navigation.
    const priorReasoning = this.rebuildReasoningFromHistory(sessionData.steps);
    const reasoning = this.analyzeInput(priorReasoning, currentNode, input);
    this.reasoning.set(sessionId, reasoning);

    let llmResponse = '';
    // Keep per-step LLM generation code behind a feature flag so
    // we can re-enable streamed guidance later without refactoring.
    if (config.enableStepLlmResponses) {
      llmResponse = await promptEngineService.generate({
        nodeId: currentNode.id,
        prompt: currentNode.prompt,
        input,
        reasoning,
        language,
      });
    }

    // Save step to memory
    await sessionMemoryService.append(
      sessionId,
      currentNode.id,
      input,
      llmResponse,
      reasoning
    );

    // Determine next state
    const nextStateId = stateLoader.getNextState(currentNode.id, input);
    const nextNode = stateLoader.getNode(nextStateId);

    if (!nextNode) {
      throw new Error(`Next node ${nextStateId} not found`);
    }

    // Update session state
    await sessionMemoryService.updateState(sessionId, nextStateId);

    if (config.debugMode) {
      console.log(`[Orchestrator] Session ${sessionId}: ${currentNode.id} -> ${nextStateId}`);
    }

    // Check if terminal
    if (nextNode.isTerminal) {
      const sessionReasoning = this.reasoning.get(sessionId);
      const summary = await this.generateSummary(sessionId, sessionReasoning);
      
      await sessionMemoryService.complete(sessionId, summary);
      
      return this.buildResponse(
        sessionId,
        sessionData.sessionType,
        nextNode,
        llmResponse || undefined,
        summary
      );
    }

    return this.buildResponse(sessionId, sessionData.sessionType, nextNode, llmResponse || undefined);
  }

  private createEmptyReasoning(): ReasoningResult {
    return {
      redFlags: [],
      recommendations: [],
      screenings: [],
      scores: {},
    };
  }

  private rebuildReasoningFromHistory(steps: ISessionStep[]): ReasoningResult {
    const reasoning = this.createEmptyReasoning();
    for (const step of steps) {
      const node = stateLoader.getNode(step.nodeId);
      if (!node) continue;
      this.analyzeInput(reasoning, node, step.input);
    }
    return reasoning;
  }

  private analyzeInput(reasoning: ReasoningResult, node: StateNode, input: any): ReasoningResult {
    const acknowledgedEmergencyChoice =
      input === 'I understand' || input === 'I need more information' || input === 'Continue to summary';

    // Red flag detection
    if (node.isRedFlagNode || node.isRedFlag) {
      if (input && !acknowledgedEmergencyChoice) {
        const values = String(input)
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
          .filter(value => value !== 'None of the above');

        for (const value of values) {
          reasoning.redFlags.push(`${node.id}: ${value}`);
        }
      }
    }

    // Analyze based on node type
    switch (node.id) {
      case 'symptom_severity':
        if (input?.includes('9-10') || input?.includes('7-8')) {
          reasoning.scores['symptomSeverity'] = input.includes('9-10') ? 10 : 8;
        }
        break;

      case 'sleep_quality':
        if (input === 'Poorly' || input === 'Not very well') {
          reasoning.recommendations.push('Consider improving sleep hygiene');
        }
        break;

      case 'stress_level':
        if (input?.includes('Very high')) {
          reasoning.recommendations.push('Explore stress management techniques');
          reasoning.scores['stressLevel'] = 9;
        }
        break;

      case 'mental_health_check':
      case 'mental_health_followup':
        if (input === 'More than half the days' || input === 'Nearly every day') {
          reasoning.recommendations.push('Consider speaking with a mental health professional');
          reasoning.screenings.push('Mental health screening');
        }
        break;

      case 'exercise_habits':
        if (input === 'Rarely or never') {
          reasoning.recommendations.push('Gradual increase in physical activity recommended');
        }
        break;

      case 'diet_habits':
        if (input === 'Poor - lots of processed food') {
          reasoning.recommendations.push('Consider nutrition counseling');
        }
        break;

      case 'screening_reminder':
        if (input === 'None recently') {
          reasoning.screenings.push('Annual physical exam');
          reasoning.screenings.push('Blood pressure check');
          reasoning.screenings.push('Basic blood work');
        }
        break;
    }

    return reasoning;
  }

  private async generateSummary(
    sessionId: string,
    reasoning?: ReasoningResult
  ): Promise<{ redFlags: string[]; recommendations: string[]; screenings: string[]; notes: string }> {
    const history = await sessionMemoryService.getHistory(sessionId);
    const sessionData = await sessionMemoryService.get(sessionId);
    
    // Get user language preference
    const user = await User.findById(sessionData?.userId);
    const language = user?.preferences?.language || DEFAULT_LANGUAGE;
    
    const steps = history.map(h => ({
      nodeId: h.nodeId,
      input: h.input,
      response: h.response,
    }));

    const finalReasoning = reasoning || this.rebuildReasoningFromHistory(history);
    const notes = await promptEngineService.generateSummary(steps, finalReasoning, language);

    return {
      redFlags: finalReasoning.redFlags || [],
      recommendations: finalReasoning.recommendations || [],
      screenings: [...new Set(finalReasoning.screenings || [])],
      notes,
    };
  }

  private buildResponse(
    sessionId: string,
    sessionType: 'annual-checkup' | 'symptom-check' | 'medication-review',
    node: StateNode,
    llmResponse?: string,
    summary?: { redFlags: string[]; recommendations: string[]; screenings: string[]; notes: string }
  ): OrchestratorResponse {
    const totalNodes = stateLoader.getNodeCount();
    const allNodes = stateLoader.getAllNodes();
    const currentIndex = allNodes.findIndex(n => n.id === node.id);
    
    return {
      sessionId,
      sessionType,
      currentState: node.id,
      node: {
        id: node.id,
        prompt: node.prompt,
        helpText: node.helpText,
        inputType: node.inputType,
        choices: node.choices,
        isTerminal: node.isTerminal,
        isRedFlag: node.isRedFlag,
      },
      llmResponse,
      progress: {
        current: currentIndex + 1,
        total: totalNodes,
        percentage: Math.round(((currentIndex + 1) / totalNodes) * 100),
      },
      summary,
    };
  }

  async getSession(sessionId: string): Promise<OrchestratorResponse | null> {
    const sessionData = await sessionMemoryService.get(sessionId);
    if (!sessionData) {
      return null;
    }

    const node = stateLoader.getNode(sessionData.currentState);
    if (!node) {
      return null;
    }

    // If session is at a terminal state, fetch the summary from the database
    let summary;
    if (node.isTerminal) {
      const { Session } = await import('../models/session.model.js');
      const session = await Session.findById(sessionId);
      console.log('[Orchestrator] Terminal session found:', session?._id, 'Has summary:', !!session?.summary);
      if (session?.summary) {
        summary = session.summary;
      } else {
        console.log('[Orchestrator] No summary in database for session:', sessionId);
      }
    }

    return this.buildResponse(sessionId, sessionData.sessionType, node, undefined, summary);
  }

  async goBack(sessionId: string): Promise<OrchestratorResponse> {
    const sessionData = await sessionMemoryService.goBack(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const node = stateLoader.getNode(sessionData.currentState);
    if (!node) {
      throw new Error(`Node ${sessionData.currentState} not found`);
    }

    return this.buildResponse(sessionId, sessionData.sessionType, node);
  }
}

export const orchestrator = new Orchestrator();

