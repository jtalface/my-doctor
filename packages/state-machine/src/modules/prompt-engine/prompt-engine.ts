import { PatientProfile } from "../patient-profile/types";

export class PromptEngine {
  /**
   * Build a prompt for the LLM
   * Returns just the essential context + node prompt, suitable for chat APIs
   */
  buildPrompt(nodePrompt: string, profile: PatientProfile | null, _sessionMemory: any): string {
    const parts: string[] = [];
    
    // Add patient context if available
    if (profile?.age || profile?.gender) {
      parts.push(`Patient info: ${profile.age ? `age ${profile.age}` : ''}${profile.age && profile.gender ? ', ' : ''}${profile.gender || ''}`);
    }
    
    // Add the current prompt/question
    parts.push(nodePrompt);
    
    return parts.join('\n\n');
  }
}
