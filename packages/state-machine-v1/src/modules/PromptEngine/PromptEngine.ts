import { PatientProfile } from "../PatientProfile/types";
import { SessionData } from "../ContextMemory/types";

/**
 * PromptEngine builds contextual prompts for the NLP model
 * by combining base prompts with patient profile and session data.
 */
export class PromptEngine {
  /**
   * Builds a complete prompt with context from profile and session.
   */
  buildPrompt(
    basePrompt: string,
    profile: PatientProfile | null,
    session: SessionData
  ): string {
    const parts: string[] = [];

    // System context
    parts.push("You are a helpful health assistant conducting a wellness check-in.");
    parts.push("Be empathetic, clear, and professional. Never provide medical diagnoses.");
    parts.push("");

    // Add patient context if available
    if (profile) {
      parts.push("=== Patient Context ===");
      if (profile.name) parts.push(`Name: ${profile.name}`);
      if (profile.age) parts.push(`Age: ${profile.age}`);
      if (profile.gender) parts.push(`Gender: ${profile.gender}`);
      if (profile.medicalHistory?.length) {
        parts.push(`Medical History: ${profile.medicalHistory.join(", ")}`);
      }
      if (profile.medications?.length) {
        parts.push(`Current Medications: ${profile.medications.map(m => m.name).join(", ")}`);
      }
      if (profile.allergies?.length) {
        parts.push(`Allergies: ${profile.allergies.join(", ")}`);
      }
      parts.push("");
    }

    // Add session context if available
    if (session.lastInput || session.lastOutput) {
      parts.push("=== Recent Conversation ===");
      if (session.lastOutput) parts.push(`Assistant: ${session.lastOutput}`);
      if (session.lastInput) parts.push(`User: ${session.lastInput}`);
      parts.push("");
    }

    // Add the current prompt instruction
    parts.push("=== Current Task ===");
    parts.push(basePrompt);
    parts.push("");
    parts.push("Respond naturally and conversationally:");

    return parts.join("\n");
  }

  /**
   * Builds a summary prompt from collected session data.
   */
  buildSummaryPrompt(_session: SessionData, profile: PatientProfile | null): string {
    const parts: string[] = [];

    parts.push("Based on the conversation, create a brief health summary including:");
    parts.push("1. Key concerns discussed");
    parts.push("2. Relevant medical history mentioned");
    parts.push("3. Recommended follow-up actions");
    parts.push("4. Any red flags that require immediate attention");
    parts.push("");

    if (profile) {
      parts.push(`Patient: ${profile.name || "Unknown"}, Age: ${profile.age || "Unknown"}`);
    }

    return parts.join("\n");
  }
}
