import { IPatientProfile } from "../models";
import { IReasoningScores, IReasoningRecommendations } from "../models/reasoning-record.model";
import { llmService, LLMResponse } from "./llm.service";

/**
 * Prompt Engine Service
 * 
 * Builds prompts for LLM generation by combining node prompts
 * with patient context, conversation history, and reasoning results.
 * Calls the LLM service for actual generation.
 */

interface PromptContext {
  nodePrompt: string;
  userInput: string;
  profile?: IPatientProfile;
  conversationHistory?: string;
  reasoning?: {
    scores?: IReasoningScores;
    recommendations?: IReasoningRecommendations;
    notes?: string[];
  };
}

export interface GenerateResult {
  response: string;
  source: "llm" | "fallback";
  prompt?: string;
  error?: string;
}

export class PromptEngineService {
  private systemContext: string;
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    this.debugMode = debugMode;
    this.systemContext = `You are a careful health education assistant. 
Your role is to gather health information and provide general health education.
You are NOT a doctor and cannot diagnose conditions or prescribe treatments.
Always encourage users to consult healthcare professionals for medical advice.
Keep responses concise, empathetic, and focused on the current question.
Do not repeat the prompt or include system instructions in your response.`;
  }

  /**
   * Build a complete prompt for LLM generation
   */
  buildPrompt(context: PromptContext): string {
    const parts: string[] = [];

    // System context
    parts.push(`[System]\n${this.systemContext}`);

    // Patient context (if available)
    if (context.profile) {
      const patientContext = this.buildPatientContext(context.profile);
      if (patientContext) {
        parts.push(`[Patient Context]\n${patientContext}`);
      }
    }

    // Reasoning context (if available)
    if (context.reasoning) {
      const reasoningContext = this.buildReasoningContext(context.reasoning);
      if (reasoningContext) {
        parts.push(`[Clinical Notes]\n${reasoningContext}`);
      }
    }

    // Conversation history (recent)
    if (context.conversationHistory) {
      parts.push(`[Recent Conversation]\n${context.conversationHistory}`);
    }

    // Current node prompt
    parts.push(`[Current Task]\n${context.nodePrompt}`);

    // User input
    parts.push(`[User Input]\n${context.userInput}`);

    // Instruction
    parts.push(`[Instruction]\nRespond directly to the user's input based on the current task. Be concise and helpful.`);

    return parts.join("\n\n");
  }

  /**
   * Build patient context string from profile
   */
  private buildPatientContext(profile: IPatientProfile): string {
    const lines: string[] = [];

    const { demographics, socialHistory, allergies, chronicConditions, medications } = profile;

    // Demographics
    if (demographics) {
      if (demographics.age) lines.push(`Age: ${demographics.age}`);
      if (demographics.sexAtBirth) lines.push(`Sex: ${demographics.sexAtBirth}`);
      if (demographics.heightM && demographics.weightKg) {
        const bmi = demographics.weightKg / (demographics.heightM * demographics.heightM);
        lines.push(`BMI: ${bmi.toFixed(1)}`);
      }
    }

    // Social history
    if (socialHistory) {
      if (socialHistory.smoking) lines.push(`Smoking: ${socialHistory.smoking}`);
      if (socialHistory.alcohol) lines.push(`Alcohol: ${socialHistory.alcohol}`);
    }

    // Allergies
    if (allergies && allergies.length > 0) {
      lines.push(`Allergies: ${allergies.map(a => a.name).join(", ")}`);
    }

    // Chronic conditions
    if (chronicConditions && chronicConditions.length > 0) {
      lines.push(`Conditions: ${chronicConditions.map(c => c.name).join(", ")}`);
    }

    // Medications
    if (medications && medications.length > 0) {
      lines.push(`Medications: ${medications.map(m => m.name).join(", ")}`);
    }

    return lines.join("\n");
  }

  /**
   * Build reasoning context string
   */
  private buildReasoningContext(reasoning: {
    scores?: IReasoningScores;
    recommendations?: IReasoningRecommendations;
    notes?: string[];
  }): string {
    const lines: string[] = [];

    // Scores
    if (reasoning.scores) {
      const scores = reasoning.scores;
      if (scores.bmi !== undefined) lines.push(`BMI: ${scores.bmi.toFixed(1)}`);
      if (scores.cardioRisk !== undefined) lines.push(`Cardio Risk Score: ${scores.cardioRisk}/10`);
      if (scores.respiratorySeverity !== undefined) lines.push(`Respiratory Severity: ${scores.respiratorySeverity}/10`);
      if (scores.depressionScore !== undefined) lines.push(`PHQ-2 Score: ${scores.depressionScore}/6`);
    }

    // Notes
    if (reasoning.notes && reasoning.notes.length > 0) {
      lines.push(`Notes: ${reasoning.notes.join("; ")}`);
    }

    // Recommendations (for assistant awareness, not to share directly)
    if (reasoning.recommendations) {
      if (reasoning.recommendations.followUpQuestions?.length > 0) {
        lines.push(`Consider asking: ${reasoning.recommendations.followUpQuestions[0]}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Generate a response using the LLM
   */
  async generate(context: PromptContext): Promise<GenerateResult> {
    const prompt = this.buildPrompt(context);

    if (this.debugMode) {
      console.log("[PromptEngine] Built prompt:", prompt.substring(0, 500) + "...");
    }

    // Call the LLM service
    const llmResponse: LLMResponse = await llmService.complete(prompt);

    if (this.debugMode) {
      console.log(`[PromptEngine] LLM response (source: ${llmResponse.source}):`, llmResponse.content);
      if (llmResponse.error) {
        console.log("[PromptEngine] LLM error:", llmResponse.error);
      }
    }

    return {
      response: llmResponse.content,
      source: llmResponse.source,
      prompt: this.debugMode ? prompt : undefined,
      error: llmResponse.error
    };
  }

  /**
   * Generate using chat format with message history
   */
  async generateWithHistory(
    context: PromptContext,
    previousMessages: Array<{ role: "user" | "assistant"; content: string }>
  ): Promise<GenerateResult> {
    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: this.systemContext }
    ];

    // Add patient context to system message if available
    if (context.profile) {
      const patientContext = this.buildPatientContext(context.profile);
      if (patientContext) {
        messages[0].content += `\n\n[Patient Context]\n${patientContext}`;
      }
    }

    // Add reasoning context if available
    if (context.reasoning) {
      const reasoningContext = this.buildReasoningContext(context.reasoning);
      if (reasoningContext) {
        messages[0].content += `\n\n[Clinical Notes]\n${reasoningContext}`;
      }
    }

    // Add previous conversation
    for (const msg of previousMessages.slice(-6)) { // Last 6 messages
      messages.push(msg);
    }

    // Add current task and user input
    messages.push({
      role: "user",
      content: `[Current Task: ${context.nodePrompt}]\n\n${context.userInput}`
    });

    // Call LLM with chat format
    const llmResponse = await llmService.chat(messages);

    return {
      response: llmResponse.content,
      source: llmResponse.source,
      error: llmResponse.error
    };
  }

  /**
   * Check if LLM is available
   */
  async checkLLMAvailability(): Promise<boolean> {
    return llmService.checkAvailability();
  }

  /**
   * Get LLM availability status
   */
  getLLMStatus(): boolean | null {
    return llmService.getAvailabilityStatus();
  }

  /**
   * Set custom system context
   */
  setSystemContext(context: string): void {
    this.systemContext = context;
  }

  /**
   * Get the current system context
   */
  getSystemContext(): string {
    return this.systemContext;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}
