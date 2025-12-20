import { stateLoader, StateNode } from './state-loader.js';
import { sessionMemoryService } from '../services/session-memory.service.js';
import { promptEngineService } from '../services/prompt-engine.service.js';
import { config } from '../config/index.js';

export interface OrchestratorResponse {
  sessionId: string;
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

  async startSession(userId: string): Promise<OrchestratorResponse> {
    // Load state machine
    const machine = stateLoader.load();
    const initialState = machine.initialState;
    const initialNode = stateLoader.getNode(initialState);

    if (!initialNode) {
      throw new Error('Failed to load initial node');
    }

    // Create session
    const sessionData = await sessionMemoryService.create(userId, initialState);
    
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

    return this.buildResponse(sessionData.sessionId, initialNode);
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

    // Run reasoning analysis
    const reasoning = this.analyzeInput(sessionId, currentNode, input);

    // Generate LLM response
    const llmResponse = await promptEngineService.generate({
      nodeId: currentNode.id,
      prompt: currentNode.prompt,
      input,
      reasoning,
    });

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
      
      return this.buildResponse(sessionId, nextNode, llmResponse, summary);
    }

    return this.buildResponse(sessionId, nextNode, llmResponse);
  }

  private analyzeInput(sessionId: string, node: StateNode, input: any): ReasoningResult {
    const reasoning = this.reasoning.get(sessionId) || {
      redFlags: [],
      recommendations: [],
      screenings: [],
      scores: {},
    };

    // Red flag detection
    if (node.isRedFlagNode || node.isRedFlag) {
      if (input && input !== 'None of the above') {
        reasoning.redFlags.push(`${node.id}: ${input}`);
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

    this.reasoning.set(sessionId, reasoning);
    return reasoning;
  }

  private async generateSummary(
    sessionId: string,
    reasoning?: ReasoningResult
  ): Promise<{ redFlags: string[]; recommendations: string[]; screenings: string[]; notes: string }> {
    const history = await sessionMemoryService.getHistory(sessionId);
    
    const steps = history.map(h => ({
      nodeId: h.nodeId,
      input: h.input,
      response: h.response,
    }));

    const notes = await promptEngineService.generateSummary(steps, reasoning);

    return {
      redFlags: reasoning?.redFlags || [],
      recommendations: reasoning?.recommendations || [],
      screenings: [...new Set(reasoning?.screenings || [])],
      notes,
    };
  }

  private buildResponse(
    sessionId: string,
    node: StateNode,
    llmResponse?: string,
    summary?: { redFlags: string[]; recommendations: string[]; screenings: string[]; notes: string }
  ): OrchestratorResponse {
    const totalNodes = stateLoader.getNodeCount();
    const allNodes = stateLoader.getAllNodes();
    const currentIndex = allNodes.findIndex(n => n.id === node.id);
    
    return {
      sessionId,
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

    return this.buildResponse(sessionId, node, undefined, summary);
  }
}

export const orchestrator = new Orchestrator();

