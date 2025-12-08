import { 
  SessionMemoryRepository, 
  ISessionMemory, 
  ISessionStep 
} from "../models";

/**
 * Session Memory Service
 * 
 * Manages conversation context and step history for sessions.
 * Backed by MongoDB for persistence.
 */
export class SessionMemoryService {
  private repo: SessionMemoryRepository;

  constructor() {
    this.repo = new SessionMemoryRepository();
  }

  /**
   * Initialize or retrieve session memory
   */
  async initialize(sessionId: string, userId: string): Promise<ISessionMemory> {
    return this.repo.findOrCreate(sessionId, userId);
  }

  /**
   * Append a new step to the session memory
   */
  async append(
    sessionId: string,
    nodeId: string,
    input: string,
    controllerData?: Record<string, unknown>,
    reasoning?: Record<string, unknown>
  ): Promise<ISessionMemory | null> {
    const step: ISessionStep = {
      nodeId,
      timestamp: new Date(),
      input,
      controllerData,
      reasoning
    };
    return this.repo.appendStep(sessionId, step);
  }

  /**
   * Update the response for the last step at a node
   */
  async updateResponse(
    sessionId: string,
    nodeId: string,
    response: string
  ): Promise<ISessionMemory | null> {
    return this.repo.updateStepResponse(sessionId, nodeId, response);
  }

  /**
   * Get full session memory
   */
  async get(sessionId: string): Promise<ISessionMemory | null> {
    return this.repo.findBySessionId(sessionId);
  }

  /**
   * Get session context (accumulated data)
   */
  async getContext(sessionId: string): Promise<Record<string, unknown>> {
    return this.repo.getContext(sessionId);
  }

  /**
   * Update session context (replace)
   */
  async updateContext(
    sessionId: string,
    context: Record<string, unknown>
  ): Promise<ISessionMemory | null> {
    return this.repo.updateContext(sessionId, context);
  }

  /**
   * Merge data into session context
   */
  async mergeContext(
    sessionId: string,
    data: Record<string, unknown>
  ): Promise<ISessionMemory | null> {
    return this.repo.mergeContext(sessionId, data);
  }

  /**
   * Get all steps for a session
   */
  async getSteps(sessionId: string): Promise<ISessionStep[]> {
    const memory = await this.repo.findBySessionId(sessionId);
    return memory?.steps || [];
  }

  /**
   * Get the last N steps
   */
  async getRecentSteps(sessionId: string, count: number): Promise<ISessionStep[]> {
    const steps = await this.getSteps(sessionId);
    return steps.slice(-count);
  }

  /**
   * Clear session memory (reset steps and context)
   */
  async clear(sessionId: string): Promise<ISessionMemory | null> {
    return this.repo.clear(sessionId);
  }

  /**
   * Delete session memory entirely
   */
  async delete(sessionId: string): Promise<boolean> {
    return this.repo.delete(sessionId);
  }

  /**
   * Build a summary of the conversation for prompt context
   */
  async buildConversationSummary(sessionId: string): Promise<string> {
    const steps = await this.getSteps(sessionId);
    if (steps.length === 0) return "";

    const summary = steps
      .map(step => {
        let line = `[${step.nodeId}] User: ${step.input}`;
        if (step.response) {
          line += `\nAssistant: ${step.response}`;
        }
        return line;
      })
      .join("\n\n");

    return summary;
  }
}

