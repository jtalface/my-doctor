import { NLP } from "./types";

// LM Studio / Meditron configuration
const LM_STUDIO_URL = "http://localhost:1235/v1/chat/completions";
const LM_STUDIO_TIMEOUT = 30000; // 30 seconds
const LM_STUDIO_MODEL = "meditron-7b";
const LM_STUDIO_CONTEXT = "[Context: You are a health education assistant. Be concise and helpful. Do not diagnose.]";

/**
 * NLP implementation that calls Meditron LLM via LM Studio
 * Falls back to dummy responses if LM Studio is unavailable
 */
export class DummyNLP implements NLP {
  async complete(prompt: string): Promise<string> {
    console.log("[DummyNLP] Sending to LM Studio::::::", prompt);

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
          max_tokens: 150,
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

      const json = await res.json();
      let response = json.choices[0].message.content;
      
      // Clean up common LLM artifacts
      response = this.cleanResponse(response);
      
      console.log("[DummyNLP] LM Studio response:", response);
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn("[DummyNLP] LM Studio error, using fallback:", errorMsg);
      return this.fallbackResponse(prompt);
    }
  }

  /**
   * Clean up common LLM response artifacts
   */
  private cleanResponse(response: string): string {
    let cleaned = response.trim();
    
    // Remove "### Response:" prefixes and everything after repeated patterns
    cleaned = cleaned.replace(/^#+\s*Response:\s*/i, '');
    cleaned = cleaned.replace(/\n#+\s*Response:[\s\S]*/i, ''); // Cut off at first repetition
    
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
    if (/routine checkup/i.test(prompt)) {
      return "Let's do a general check-in. I will ask about your health history and habits.";
    }
    if (/chest pain|shortness of breath|suicid/i.test(prompt)) {
      return "Those symptoms can sometimes be serious. I'll remind you that for urgent or severe symptoms, in-person or emergency care is important.";
    }
    return "Okay, I've noted that. I'll ask a few more questions to understand your situation better.";
  }
}
