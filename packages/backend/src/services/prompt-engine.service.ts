import { IPatientProfile } from "../models";
import { IReasoningScores, IReasoningRecommendations } from "../models/reasoning-record.model";

/**
 * Prompt Engine Service
 * 
 * Builds prompts for LLM generation by combining node prompts
 * with patient context, conversation history, and reasoning results.
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

export class PromptEngineService {
  private systemContext: string;

  constructor() {
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
   * Generate a simple response (stub for MVP - in production, call LLM)
   */
  async generate(context: PromptContext): Promise<string> {
    // In production, this would call an LLM API
    // For MVP, return a synthetic response based on node type
    const prompt = this.buildPrompt(context);
    
    // Log the prompt for debugging
    console.log("[PromptEngine] Built prompt:", prompt.substring(0, 500) + "...");

    // Return a placeholder that indicates the prompt was built
    return this.generateStubResponse(context);
  }

  /**
   * Generate a stub response for MVP (no actual LLM call)
   */
  private generateStubResponse(context: PromptContext): string {
    const nodePrompt = context.nodePrompt.toLowerCase();
    const input = context.userInput.toLowerCase();

    // Welcome/greeting
    if (/welcome|hello|hi|start/i.test(nodePrompt)) {
      return "Hello! I'm here to help you with your health check-in. Let's get started.";
    }

    // Demographics
    if (/age|birth|sex|gender|demographic/i.test(nodePrompt)) {
      return "Thank you for sharing that information. I've noted your demographics.";
    }

    // Medical history
    if (/medical history|condition|diagnosis|chronic/i.test(nodePrompt)) {
      return "I've recorded your medical history. This helps me understand your health better.";
    }

    // Medications
    if (/medication|medicine|prescription|drug/i.test(nodePrompt)) {
      return "Thank you for listing your medications. It's important to keep track of these.";
    }

    // Symptoms
    if (/symptom|pain|feel|experiencing/i.test(nodePrompt)) {
      if (/chest|heart/i.test(input)) {
        return "I understand you're experiencing chest-related symptoms. For any severe or sudden chest pain, please seek immediate medical attention.";
      }
      if (/breath|breathing/i.test(input)) {
        return "Breathing difficulties can have many causes. If you're having severe trouble breathing, please seek immediate care.";
      }
      return "Thank you for describing your symptoms. Let me ask a few more questions to understand better.";
    }

    // Screening
    if (/screen|prevent|checkup/i.test(nodePrompt)) {
      return "Based on your age and health profile, I can suggest some preventive screenings to discuss with your doctor.";
    }

    // Summary
    if (/summary|review|conclude/i.test(nodePrompt)) {
      return "Thank you for completing this health check-in. Please review the summary and discuss any concerns with your healthcare provider.";
    }

    // Default
    return "I've noted that. Please continue with the next question.";
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
}

