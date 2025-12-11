/**
 * LLM Service
 * 
 * Calls Meditron LLM via LM Studio for medical assistant responses.
 * Falls back to stub responses if LM Studio is unavailable.
 */

// LM Studio / Meditron configuration
const LM_STUDIO_URL = process.env.LM_STUDIO_URL || "http://localhost:1235/v1/chat/completions";
const LM_STUDIO_TIMEOUT = parseInt(process.env.LM_STUDIO_TIMEOUT || "30000", 10);
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || "meditron-7b";
const LM_STUDIO_CONTEXT = "[Context: You are a health education assistant. Be concise and helpful. Do not diagnose.]";

export interface LLMResponse {
  content: string;
  source: "llm" | "fallback";
  error?: string;
}

export class LLMService {
  private isAvailable: boolean | null = null;

  /**
   * Check if LM Studio is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(LM_STUDIO_URL.replace("/chat/completions", "/models"), {
        method: "GET",
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      this.isAvailable = res.ok;
      return this.isAvailable;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Complete a prompt using the LLM
   */
  async complete(prompt: string): Promise<LLMResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LM_STUDIO_TIMEOUT);

      const res = await fetch(LM_STUDIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages: [
            {
              role: "user",
              content: `${LM_STUDIO_CONTEXT}\n\n${prompt}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7,
          stop: ["###", "Response:", "User:", "\n\n\n", "[Context:"],
          repeat_penalty: 1.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as { choices: Array<{ message: { content: string } }> };
      let content = json.choices[0].message.content;

      // Clean up the response
      content = this.cleanResponse(content);
      this.isAvailable = true;

      return {
        content,
        source: "llm"
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("[LLMService] Error, using fallback:", errorMsg);
      this.isAvailable = false;

      return {
        content: this.fallbackResponse(prompt),
        source: "fallback",
        error: errorMsg
      };
    }
  }

  /**
   * Generate a chat completion with full message history
   */
  async chat(messages: Array<{ role: "system" | "user" | "assistant"; content: string }>): Promise<LLMResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LM_STUDIO_TIMEOUT);

      const res = await fetch(LM_STUDIO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages,
          max_tokens: 200,
          temperature: 0.7,
          stop: ["###", "Response:", "User:", "\n\n\n", "[Context:"],
          repeat_penalty: 1.2
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json() as { choices: Array<{ message: { content: string } }> };
      let content = json.choices[0].message.content;

      content = this.cleanResponse(content);
      this.isAvailable = true;

      return {
        content,
        source: "llm"
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("[LLMService] Chat error, using fallback:", errorMsg);
      this.isAvailable = false;

      // Extract last user message for fallback
      const lastUserMessage = messages.filter(m => m.role === "user").pop();
      const prompt = lastUserMessage?.content || "";

      return {
        content: this.fallbackResponse(prompt),
        source: "fallback",
        error: errorMsg
      };
    }
  }

  /**
   * Clean up common LLM response artifacts
   */
  private cleanResponse(response: string): string {
    let cleaned = response.trim();

    // Remove "### Response:" prefixes and everything after repeated patterns
    cleaned = cleaned.replace(/^#+\s*Response:\s*/i, '');
    cleaned = cleaned.replace(/\n#+\s*Response:[\s\S]*/i, '');

    // Remove common prefixes that LLMs add
    const prefixesToRemove = [
      /^(Assistant|AI|Bot|System|Health Assistant):\s*/i,
      /^(Response|Answer|Reply):\s*/i,
    ];

    for (const pattern of prefixesToRemove) {
      cleaned = cleaned.replace(pattern, '');
    }

    // Remove any quoted system instructions that leaked
    cleaned = cleaned.replace(/["']?You are a.*?\.["']?\s*/gi, '');
    cleaned = cleaned.replace(/["']?Do not diagnose.*?\.["']?\s*/gi, '');
    cleaned = cleaned.replace(/\[Context:.*?\]\s*/gi, '');

    // If response is empty after cleaning, return a generic message
    cleaned = cleaned.trim();
    if (!cleaned) {
      return "I understand. Please continue.";
    }

    return cleaned;
  }

  /**
   * Fallback responses when LM Studio is not available
   */
  private fallbackResponse(prompt: string): string {
    const promptLower = prompt.toLowerCase();

    // Welcome/greeting
    if (/welcome|hello|hi|start|check-?in/i.test(promptLower)) {
      return "Hello! I'm here to help you with your health check-in. Let's get started.";
    }

    // Demographics
    if (/age|birth|sex|gender|demographic/i.test(promptLower)) {
      return "Thank you for sharing that information. I've noted your demographics.";
    }

    // Medical history
    if (/medical history|condition|diagnosis|chronic|disease/i.test(promptLower)) {
      return "I've recorded your medical history. This helps me understand your health better.";
    }

    // Medications
    if (/medication|medicine|prescription|drug|vitamin|supplement/i.test(promptLower)) {
      return "Thank you for listing your medications. It's important to keep track of these.";
    }

    // Allergies
    if (/allerg/i.test(promptLower)) {
      return "I've noted your allergies. This is important information for your health profile.";
    }

    // Symptoms - urgent
    if (/chest pain|shortness of breath|can't breathe|suicid|emergency/i.test(promptLower)) {
      return "Those symptoms can sometimes be serious. For urgent or severe symptoms, please seek in-person or emergency care immediately.";
    }

    // Symptoms - general
    if (/symptom|pain|feel|experiencing|hurt/i.test(promptLower)) {
      return "Thank you for describing your symptoms. Let me ask a few more questions to understand better.";
    }

    // Screening
    if (/screen|prevent|checkup|routine/i.test(promptLower)) {
      return "Based on your age and health profile, I can suggest some preventive screenings to discuss with your doctor.";
    }

    // Consent
    if (/consent|understand|agree/i.test(promptLower)) {
      return "Thank you for confirming. Let's continue with the health check-in.";
    }

    // Summary
    if (/summary|review|conclude|complete/i.test(promptLower)) {
      return "Thank you for completing this health check-in. Please review the summary and discuss any concerns with your healthcare provider.";
    }

    // Default
    return "I've noted that. Let's continue with the next question.";
  }

  /**
   * Get current availability status
   */
  getAvailabilityStatus(): boolean | null {
    return this.isAvailable;
  }
}

// Export singleton instance
export const llmService = new LLMService();

